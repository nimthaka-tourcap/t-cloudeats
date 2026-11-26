"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Lock,
  Unlock,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Landmark,
  TrendingUp,
  AlertCircle,
  Search,
  ShoppingBag,
  RotateCw,
  Clock,
  Sparkles
} from "lucide-react";
import { CashierOrder, stepDateStr, getTodayDateStr, getOrderPaymentMode, OrderPaymentMode } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

interface ShiftTallyViewProps {
  selectedLogDate: string;
  setSelectedLogDate: (d: string) => void;
  tallySubmitted: boolean;
  onSubmitTally: () => void;
  onUnlockTally: () => void;
  openingBalance: number;
  setOpeningBalance: (v: number) => void;
  actualCash: number;
  setActualCash: (v: number) => void;
  bankTransfer: number;
  setBankTransfer: (v: number) => void;
  operationalExpenses: ExpenseItem[];
  onSaveShiftTally: (
    openBal: number,
    bank: number,
    cash: number,
    exps: ExpenseItem[]
  ) => void;
  todaysOrders: CashierOrder[];
  todaysCreditOrders: CashierOrder[];
  todaysCreditAmount: number;
  expenseCategories: string[];
  newExpenseCategory: string;
  setNewExpenseCategory: (c: string) => void;
  newExpenseDesc: string;
  setNewExpenseDesc: (d: string) => void;
  newExpenseAmt: string;
  setNewExpenseAmt: (a: string) => void;
  onAddExpense: (e: React.FormEvent) => void;
  onRemoveExpense: (id: string) => void;
  reportFilter?: string;
  setReportFilter?: (f: any) => void;
  filteredReportOrders?: CashierOrder[];
  customersCount?: number;
  onOpenCms?: () => void;
  renderAdminMetric: (val: string, cls: string) => React.ReactNode;
  carryForwardBalance?: number;
  prevShiftDateStr?: string | null;
  onPaymentStatusChange?: (orderId: string, status: OrderPaymentMode | "Paid" | "Not Paid") => void;
  allOrders?: CashierOrder[];
  onOpenSplitModal?: (order: CashierOrder) => void;
}

export default function ShiftTallyView({
  selectedLogDate,
  setSelectedLogDate,
  tallySubmitted,
  onSubmitTally,
  onUnlockTally,
  openingBalance,
  setOpeningBalance,
  actualCash,
  setActualCash,
  bankTransfer,
  setBankTransfer,
  operationalExpenses,
  onSaveShiftTally,
  todaysOrders,
  todaysCreditOrders,
  todaysCreditAmount,
  expenseCategories,
  newExpenseCategory,
  setNewExpenseCategory,
  newExpenseDesc,
  setNewExpenseDesc,
  newExpenseAmt,
  setNewExpenseAmt,
  onAddExpense,
  onRemoveExpense,
  renderAdminMetric,
  carryForwardBalance = 0,
  prevShiftDateStr,
  onPaymentStatusChange,
  allOrders,
  onOpenSplitModal,
}: ShiftTallyViewProps) {
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "CASH" | "BANK" | "CREDIT" | "SPLIT" | "RECOVERED" | "DELIVERY" | "TAKEAWAY">("ALL");

  // Payment Breakdown Computations for Today's Orders
  const cashOrders = todaysOrders.filter(o => getOrderPaymentMode(o) === "Cash");
  const cashOrdersRevenue = cashOrders.reduce((sum, o) => sum + o.total, 0);

  const bankOrders = todaysOrders.filter(o => getOrderPaymentMode(o) === "Account Transfer");
  const bankOrdersRevenue = bankOrders.reduce((sum, o) => sum + o.total, 0);

  const creditOrders = todaysOrders.filter(o => getOrderPaymentMode(o) === "Credit");
  const creditOrdersRevenue = creditOrders.reduce((sum, o) => sum + o.total, 0);

  const splitOrders = todaysOrders.filter(o => getOrderPaymentMode(o) === "Split");
  const todaySplitCashRevenue = splitOrders.reduce((sum, o) => sum + (o.customer?.split_cash_amount || 0), 0);
  const todaySplitBankRevenue = splitOrders.reduce((sum, o) => sum + (o.customer?.split_bank_amount || 0), 0);

  const deliveryOrders = todaysOrders.filter(o => o.type === "Delivery" || o.type === "Direct");
  const takeAwayOrders = todaysOrders.filter(o => o.type === "Take Away" || o.type === "POS");

  // Past Credit Bills settled on this shift date (e.g. 1 week later!)
  const pastCreditSettledToday = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(o => {
      if (o.status === "Voided" || o.status === "Ignored") return false;
      const orderDateStr = (o.timestamp || "").slice(0, 10);
      const isPastDate = orderDateStr !== selectedLogDate;
      const settledDate = o.customer?.settled_biz_date;
      return isPastDate && settledDate === selectedLogDate;
    });
  }, [allOrders, selectedLogDate]);

  const pastCreditCashCollected = useMemo(() => {
    return pastCreditSettledToday.reduce((sum, o) => {
      const mode = getOrderPaymentMode(o);
      if (mode === "Cash") return sum + o.total;
      if (mode === "Split") return sum + (o.customer?.split_cash_amount || 0);
      return sum;
    }, 0);
  }, [pastCreditSettledToday]);

  const pastCreditBankCollected = useMemo(() => {
    return pastCreditSettledToday.reduce((sum, o) => {
      const mode = getOrderPaymentMode(o);
      if (mode === "Account Transfer") return sum + o.total;
      if (mode === "Split") return sum + (o.customer?.split_bank_amount || 0);
      return sum;
    }, 0);
  }, [pastCreditSettledToday]);

  // Core Shift Financial Calculations
  const shiftRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExp = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);

  const expectedCashRevenue = Math.max(
    0,
    cashOrdersRevenue + todaySplitCashRevenue
  );

  // Expected closing cash accounts for opening float, previous shift carry forward, cash revenue + past credit cash settled today minus costs
  const expectedClosingCash = openingBalance + carryForwardBalance + expectedCashRevenue + pastCreditCashCollected - totalExp;
  const discrepancy = actualCash - expectedClosingCash;

  // Expected bank transfers = bank orders + split bank + past credit bank settled today
  const expectedBankTransfersTotal = bankOrdersRevenue + todaySplitBankRevenue + pastCreditBankCollected;
  const totalClosingBalance = actualCash + bankTransfer;
  const isToday = selectedLogDate === getTodayDateStr();

  // Filtered Orders for the bottom Shift Orders Ledger
  const filteredOrders = useMemo(() => {
    const sourceList = ledgerFilter === "RECOVERED" ? pastCreditSettledToday : todaysOrders;
    return sourceList.filter(o => {
      // 1. Filter Tab
      const pMode = getOrderPaymentMode(o);
      if (ledgerFilter === "CASH" && pMode !== "Cash") return false;
      if (ledgerFilter === "BANK" && pMode !== "Account Transfer") return false;
      if (ledgerFilter === "CREDIT" && pMode !== "Credit") return false;
      if (ledgerFilter === "SPLIT" && pMode !== "Split") return false;
      if (ledgerFilter === "DELIVERY" && o.type !== "Delivery" && o.type !== "Direct") return false;
      if (ledgerFilter === "TAKEAWAY" && o.type !== "Take Away" && o.type !== "POS") return false;

      // 2. Search Query
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customer?.name?.toLowerCase().includes(q);
        const matchPhone = o.customer?.phone?.toLowerCase().includes(q);
        return matchId || matchName || matchPhone;
      }
      return true;
    });
  }, [todaysOrders, pastCreditSettledToday, ledgerFilter, ledgerSearch]);

  const filteredOrdersTotal = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total, 0);
  }, [filteredOrders]);

  const formatOrderTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Date Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Daily Shift Tally &amp; Drawer Balancing
            </h2>
            {tallySubmitted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                <Lock size={12} /> Shift Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wider">
                <Clock size={12} /> Open Shift
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {todaysOrders.length} shift orders recorded • Shift Date: <span className="font-mono font-bold text-slate-700">{selectedLogDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Business Date:</span>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
            <button
              type="button"
              onClick={() => setSelectedLogDate(stepDateStr(selectedLogDate, -1))}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 active:scale-95 transition cursor-pointer"
              title="Previous Day (Left Arrow ←)"
              aria-label="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedLogDate}
              onChange={(e) => setSelectedLogDate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  setSelectedLogDate(stepDateStr(selectedLogDate, -1));
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  setSelectedLogDate(stepDateStr(selectedLogDate, 1));
                }
              }}
              className="bg-transparent border-0 px-2 text-sm text-slate-900 font-mono outline-none cursor-pointer"
              title="Use Arrow keys (← / →) to switch dates"
            />
            <button
              type="button"
              onClick={() => setSelectedLogDate(stepDateStr(selectedLogDate, 1))}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 active:scale-95 transition cursor-pointer"
              title="Next Day (Right Arrow →)"
              aria-label="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedLogDate(getTodayDateStr())}
              className="h-[38px] px-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-semibold transition cursor-pointer"
              title="Jump to Today's Shift"
            >
              Today
            </button>
          )}

          {tallySubmitted && (
            <button
              type="button"
              onClick={onUnlockTally}
              className="h-[38px] px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Unlock Shift Tally for Edits"
            >
              <Unlock size={14} /> Unlock
            </button>
          )}
        </div>
      </div>

      {/* 2. Core Drawer Workspace: Inputs + Expenses + Reconciliation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
        {carryForwardBalance !== 0 && (
          <div className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
            carryForwardBalance > 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider ${
                carryForwardBalance > 0 ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
              }`}>
                {carryForwardBalance > 0 ? "Excess Carried Forward" : "Shortage Carried Forward"}
              </span>
              <span className="font-medium">
                {carryForwardBalance > 0
                  ? `Previous shift (${prevShiftDateStr || "Past Shift"}) ended with an overage of +${formatLKR2(carryForwardBalance)}, carried over to today's float.`
                  : `Previous shift (${prevShiftDateStr || "Past Shift"}) ended with a shortage of -${formatLKR2(Math.abs(carryForwardBalance))}, carried over to today's float.`}
              </span>
            </div>
            <span className="text-[11px] font-bold opacity-80 font-mono">
              Applied into Expected Closing Cash
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Col 1: Drawer Physical Inputs */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-3">
                <Banknote size={16} className="text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cash &amp; Drawer Counting
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Opening Float (LKR)
                  </label>
                  <input
                    type="number"
                    disabled={tallySubmitted}
                    value={openingBalance || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setOpeningBalance(val);
                      onSaveShiftTally(val, bankTransfer, actualCash, operationalExpenses);
                    }}
                    placeholder="0.00"
                    className="min-h-[44px] w-full bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 font-mono text-right outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 disabled:opacity-40"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Starting cash kept in drawer</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Actual Cash Counted in Drawer (LKR)
                  </label>
                  <input
                    type="number"
                    disabled={tallySubmitted}
                    value={actualCash || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setActualCash(val);
                      onSaveShiftTally(openingBalance, bankTransfer, val, operationalExpenses);
                    }}
                    placeholder="0.00"
                    className="min-h-[44px] w-full bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-bold text-slate-950 font-mono text-right outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 disabled:opacity-40"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Physical cash notes &amp; coins in hand</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-semibold">
                      Account Transfer Total (LKR)
                    </label>
                    {!tallySubmitted && bankTransfer !== expectedBankTransfersTotal && expectedBankTransfersTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setBankTransfer(expectedBankTransfersTotal);
                          onSaveShiftTally(openingBalance, expectedBankTransfersTotal, actualCash, operationalExpenses);
                        }}
                        className="text-sky-600 hover:text-sky-800 font-bold underline text-[10px] cursor-pointer"
                        title="Autofill from account transfer orders & recovered credit"
                      >
                        Fill ({formatLKR2(expectedBankTransfersTotal)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    disabled={tallySubmitted}
                    value={bankTransfer || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setBankTransfer(val);
                      onSaveShiftTally(openingBalance, val, actualCash, operationalExpenses);
                    }}
                    placeholder="0.00"
                    className="min-h-[44px] w-full bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 font-mono text-right outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 disabled:opacity-40"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Direct bank transfers verified via slip</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              {todaysCreditOrders.length > 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs text-rose-900">
                  <span className="font-semibold text-rose-800">Unpaid Credit Orders ({todaysCreditOrders.length})</span>
                  <span className="font-mono font-bold text-rose-700">-{formatLKR2(todaysCreditAmount)}</span>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-semibold">All Shift Orders Paid</span>
                  <span className="font-mono font-bold">{formatLKR2(0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Daily Operational Expenses */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Daily Shift Expenses
                </h3>
                <span className="text-xs font-mono font-bold text-rose-600 tabular-nums">
                  -{formatLKR2(totalExp)}
                </span>
              </div>

              {operationalExpenses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                  No petty expenses logged for this shift.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {operationalExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-slate-900 font-bold truncate">{exp.category}</p>
                        {exp.description && (
                          <p className="text-slate-500 text-[11px] truncate">{exp.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold tabular-nums text-rose-600">
                          {formatLKR2(exp.amount)}
                        </span>
                        <button
                          type="button"
                          disabled={tallySubmitted}
                          onClick={() => {
                            setNewExpenseCategory(exp.category);
                            setNewExpenseDesc(exp.description || "");
                            setNewExpenseAmt(String(exp.amount));
                            onRemoveExpense(exp.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Edit Expense"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={tallySubmitted}
                          onClick={() => onRemoveExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onAddExpense} className="space-y-2 pt-3 border-t border-slate-200">
              <select
                disabled={tallySubmitted}
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                className="min-h-[40px] w-full bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-900 font-medium outline-none disabled:opacity-40"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                disabled={tallySubmitted}
                placeholder="Detail (e.g. Bill #, supplier note)"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                className="min-h-[40px] w-full bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-900 outline-none disabled:opacity-40"
              >
              </input>
              <div className="flex gap-2">
                <input
                  type="number"
                  disabled={tallySubmitted}
                  placeholder="Amount (LKR)"
                  value={newExpenseAmt}
                  onChange={(e) => setNewExpenseAmt(e.target.value)}
                  className="min-h-[40px] flex-1 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-900 font-mono text-right outline-none disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={tallySubmitted}
                  className="min-h-[40px] px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-40"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </form>
          </div>

          {/* Col 3: Live Reconciliation Summary & Action */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Reconciliation Summary
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Formula Checked</span>
              </div>

              <div className="space-y-3 pt-1">
                {/* 1. Sales Breakdown */}
                <div className="space-y-1.5 pb-2.5 border-b border-slate-200/80">
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Shift Total Orders Sales</span>
                    <span className="font-mono tabular-nums text-slate-950 font-bold">{formatLKR2(shiftRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>(-) Account Transfers</span>
                    <span className="font-mono tabular-nums font-medium">-{formatLKR2(bankTransfer)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>(-) Unpaid Credit</span>
                    <span className="font-mono tabular-nums font-bold">-{formatLKR2(todaysCreditAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-dashed border-slate-200">
                    <span className="text-slate-600 font-medium">Expected Cash from Orders</span>
                    <span className="font-mono tabular-nums text-emerald-700">{formatLKR2(expectedCashRevenue)}</span>
                  </div>
                </div>

                {/* 2. Physical Drawer Floating & Costs */}
                <div className="space-y-1.5 pb-2.5 border-b border-slate-200/80">
                  <div className="flex justify-between text-slate-600">
                    <span>(+) Opening Cash Float</span>
                    <span className="font-mono tabular-nums font-medium">+{formatLKR2(openingBalance)}</span>
                  </div>
                  {carryForwardBalance !== 0 && (
                    <div className={`flex justify-between font-semibold ${carryForwardBalance > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      <span>Prev Shift Carry-Over ({prevShiftDateStr || "Past"})</span>
                      <span className="font-mono tabular-nums">
                        {carryForwardBalance > 0 ? `+${formatLKR2(carryForwardBalance)}` : `-${formatLKR2(Math.abs(carryForwardBalance))}`}
                      </span>
                    </div>
                  )}
                  {pastCreditCashCollected > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>(+) Past Credit Recovered (Cash)</span>
                      <span className="font-mono tabular-nums">+{formatLKR2(pastCreditCashCollected)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-rose-700">
                    <span>(-) Shift Operational Costs</span>
                    <span className="font-mono tabular-nums font-medium">-{formatLKR2(totalExp)}</span>
                  </div>
                </div>

                {/* 3. Expected vs Actual Drawer Cash */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-950 text-xs">
                    <span>Expected Drawer Cash</span>
                    <span className="font-mono tabular-nums text-sky-700 text-sm">
                      {formatLKR2(expectedClosingCash)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 text-xs">
                    <span>Actual Cash Counted</span>
                    <span className="font-mono tabular-nums text-sm">
                      {formatLKR2(actualCash)}
                    </span>
                  </div>

                  {/* Live Discrepancy Status Pill */}
                  <div
                    className={`mt-2 py-2 px-3 rounded-xl text-center font-bold text-xs ${
                      discrepancy === 0
                        ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300"
                        : discrepancy > 0
                        ? "bg-amber-100/80 text-amber-900 border border-amber-300"
                        : "bg-rose-100/80 text-rose-900 border border-rose-300"
                    }`}
                  >
                    {discrepancy === 0
                      ? "✓ Balanced (Rs. 0.00 Variance)"
                      : discrepancy > 0
                      ? `Overage: +${formatLKR2(discrepancy)} (Carried Forward)`
                      : `Shortage: -${formatLKR2(Math.abs(discrepancy))} (Carried Forward)`}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Total Shift Assets (Cash + Bank)</span>
                <span className="font-mono tabular-nums font-black text-sm text-slate-950">
                  {formatLKR2(totalClosingBalance)}
                </span>
              </div>

              {!tallySubmitted ? (
                <button
                  type="button"
                  onClick={onSubmitTally}
                  className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Submit &amp; Lock Shift Tally</span>
                </button>
              ) : (
                <div className="w-full min-h-[46px] rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
                  <Lock size={15} />
                  <span>Shift Tally Locked</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: This Shift's Itemized Orders Ledger (#1) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <ShoppingBag size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Shift Orders Ledger
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold font-mono">
                  {filteredOrders.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Itemized transaction verification for {selectedLogDate} • Filtered Total: <strong className="text-slate-800 font-mono">{formatLKR2(filteredOrdersTotal)}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="min-h-[36px] pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-sky-500 w-48 sm:w-56"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1 rounded-xl">
              {[
                { id: "ALL", label: `All (${todaysOrders.length})` },
                { id: "CASH", label: `Cash (${cashOrders.length})` },
                { id: "BANK", label: `Account Transfer (${bankOrders.length})` },
                { id: "CREDIT", label: `Credit (${creditOrders.length})` },
                { id: "SPLIT", label: `Split (${splitOrders.length})` },
                ...(pastCreditSettledToday.length > 0 ? [{ id: "RECOVERED", label: `Recovered Past Bills (${pastCreditSettledToday.length})` }] : []),
                { id: "DELIVERY", label: `Delivery (${deliveryOrders.length})` },
                { id: "TAKEAWAY", label: `Take Away (${takeAwayOrders.length})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setLedgerFilter(pill.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    ledgerFilter === pill.id
                      ? pill.id === "CREDIT"
                        ? "bg-rose-600 text-white shadow-xs"
                        : pill.id === "RECOVERED"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-sky-500 text-white shadow-xs"
                      : pill.id === "CREDIT" && creditOrders.length > 0
                      ? "text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-900 border border-rose-200"
                      : pill.id === "RECOVERED"
                      ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-1">
            <ShoppingBag size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No shift orders found matching your filter</p>
            <p>Try switching filter tabs or checking a different business date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer Details</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const paymentMode = getOrderPaymentMode(order);
                  const isVoid = order.status === "Voided";
                  const customerName = order.customer?.name || "Walk-in Customer";
                  const customerPhone = order.customer?.phone || "-";
                  const isDelivery = order.type === "Delivery" || order.type === "Direct";

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isVoid ? "opacity-50 line-through bg-slate-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {formatOrderTime(order.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{customerName}</p>
                          <p className="font-mono text-[10px] text-slate-400 truncate">{customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isDelivery
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : order.type === "3rd Party" || order.type === "Pick Up"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {onPaymentStatusChange && !tallySubmitted && !isVoid ? (
                            <select
                              value={paymentMode}
                              onChange={(e) => {
                                const val = e.target.value as OrderPaymentMode;
                                if (val === "Split") {
                                  onOpenSplitModal ? onOpenSplitModal(order) : onPaymentStatusChange(order.id, "Split");
                                } else {
                                  onPaymentStatusChange(order.id, val);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg border text-xs font-bold bg-white outline-none cursor-pointer transition-colors ${
                                paymentMode === "Cash"
                                  ? "border-emerald-300 text-emerald-700 bg-emerald-50/60"
                                  : paymentMode === "Account Transfer"
                                  ? "border-sky-300 text-sky-700 bg-sky-50/60"
                                  : paymentMode === "Split"
                                  ? "border-purple-300 text-purple-700 bg-purple-50/70"
                                  : "border-rose-300 text-rose-700 bg-rose-50/80"
                              }`}
                            >
                              <option value="Cash">Cash</option>
                              <option value="Account Transfer">Account Transfer</option>
                              <option value="Credit">Credit</option>
                              <option value="Split">Split (Cash + Bank)</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              paymentMode === "Cash"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : paymentMode === "Account Transfer"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : paymentMode === "Split"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {paymentMode}
                            </span>
                          )}

                          {paymentMode === "Split" && (
                            <button
                              type="button"
                              onClick={() => onOpenSplitModal && onOpenSplitModal(order)}
                              className="text-[10px] text-purple-700 hover:text-purple-900 font-mono font-medium hover:underline text-left cursor-pointer"
                              title="Click to view/edit split amounts"
                            >
                              Cash: {formatLKR2(order.customer?.split_cash_amount || 0)} • Bank: {formatLKR2(order.customer?.split_bank_amount || 0)}
                            </button>
                          )}

                          {paymentMode === "Credit" && !tallySubmitted && !isVoid && (
                            <button
                              type="button"
                              onClick={() => onOpenSplitModal && onOpenSplitModal(order)}
                              className="text-[10px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                              title="Settle this credit order with Cash, Bank, or Split"
                            >
                              Settle Bill / Split
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium max-w-[200px] truncate" title={order.items.map(it => `${it.quantity}x ${it.menuItem?.title || (it as any).title || "Item"}`).join(", ")}>
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}: {order.items.map(it => `${it.quantity}x ${it.menuItem?.title || (it as any).title || "Item"}`).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-950 text-sm whitespace-nowrap">
                        {formatLKR2(order.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
