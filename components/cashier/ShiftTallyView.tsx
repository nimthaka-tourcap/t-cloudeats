"use client";

import React, { useState } from "react";
import { Plus, Trash2, Lock, Unlock, Users, Pencil } from "lucide-react";
import { CashierOrder } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";
import SalesAnalyticsView from "./SalesAnalyticsView";

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
  reportFilter: string;
  setReportFilter: (f: any) => void;
  filteredReportOrders: CashierOrder[];
  customersCount: number;
  onOpenCms: () => void;
  renderAdminMetric: (val: string, cls: string) => React.ReactNode;
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
  reportFilter,
  setReportFilter,
  filteredReportOrders,
  customersCount,
  onOpenCms,
  renderAdminMetric,
}: ShiftTallyViewProps) {
  const [tallySubTab, setTallySubTab] = useState<"TALLY" | "ANALYTICS">("TALLY");
  const shiftRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExp = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedCashRevenue = Math.max(
    0,
    shiftRevenue - bankTransfer - todaysCreditAmount
  );
  const expectedClosingCash = openingBalance + expectedCashRevenue - totalExp;
  const discrepancy = actualCash - expectedClosingCash;
  const totalClosingBalance = actualCash + bankTransfer;

  const posOrders = filteredReportOrders.filter(
    (o) => o.type === "Take Away" || o.type === "POS"
  );
  const directOrders = filteredReportOrders.filter(
    (o) => o.type === "Delivery" || o.type === "Direct"
  );
  const thirdPartyOrders = filteredReportOrders.filter(
    (o) => o.type === "Pick Up" || o.type === "3rd Party"
  );
  const dineInOrders = filteredReportOrders.filter((o) => o.type === "Dine In");

  return (
    <div className="space-y-6">
      <div className="inline-flex p-1 rounded-xl bg-[#111318] gap-1">
        <button
          type="button"
          onClick={() => setTallySubTab("TALLY")}
          className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${
            tallySubTab === "TALLY" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Shift Tally &amp; Cash
        </button>
        <button
          type="button"
          onClick={() => setTallySubTab("ANALYTICS")}
          className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${
            tallySubTab === "ANALYTICS" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Sales &amp; Dish Performance
        </button>
      </div>

      {tallySubTab === "ANALYTICS" ? (
        <SalesAnalyticsView />
      ) : (
        <>
      {/* Shift Tally Card */}
      <div className="bg-[#111318] border border-[#1F2430] rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2430] pb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Daily Shift Tally &amp; Cash Drawer
            </h3>
            <p className="text-xs text-zinc-400">
              {todaysOrders.length} orders • Shift Date: {selectedLogDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedLogDate}
              onChange={(e) => setSelectedLogDate(e.target.value)}
              className="min-h-[44px] bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
              style={{ colorScheme: "dark" }}
            />
            {tallySubmitted && (
              <button
                type="button"
                onClick={onUnlockTally}
                className="min-h-[44px] px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock size={14} /> Unlock
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Col 1: Drawer Inputs */}
          <div className="lg:col-span-4 bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Cash &amp; Bank Inputs</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Opening Float (LKR)</label>
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
                  className="min-h-[44px] w-full bg-[#111318] border border-[#1F2430] rounded-xl px-3.5 text-sm text-white font-mono text-right outline-none focus:border-[#F26F21] disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Actual Cash Counted (LKR)</label>
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
                  className="min-h-[44px] w-full bg-[#111318] border border-[#1F2430] rounded-xl px-3.5 text-sm text-white font-mono text-right outline-none focus:border-[#F26F21] disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Bank Transfer Actual (LKR)</label>
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
                  className="min-h-[44px] w-full bg-[#111318] border border-[#1F2430] rounded-xl px-3.5 text-sm text-white font-mono text-right outline-none focus:border-[#F26F21] disabled:opacity-40"
                />
              </div>

              <div className="pt-1">
                {todaysCreditOrders.length > 0 ? (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex justify-between text-xs text-rose-300">
                    <span>Unpaid Credit ({todaysCreditOrders.length} bills)</span>
                    <span className="font-mono tabular-nums">-{formatLKR2(todaysCreditAmount)}</span>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between text-xs text-emerald-400">
                    <span>Unpaid Credit Orders</span>
                    <span className="font-mono">{formatLKR2(0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Daily Operational Expenses */}
          <div className="lg:col-span-4 bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-4 flex flex-col justify-between gap-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Daily Expenses</p>
                <span className="text-xs font-mono tabular-nums text-rose-400">
                  -{formatLKR2(totalExp)}
                </span>
              </div>

              {operationalExpenses.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3">No expenses logged for this shift.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {operationalExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between bg-[#111318] border border-[#1F2430] rounded-lg px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-white font-medium truncate">{exp.category}</p>
                        {exp.description && (
                          <p className="text-zinc-500 truncate">{exp.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono tabular-nums text-rose-400">
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
                          className="text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Edit Expense"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={tallySubmitted}
                          onClick={() => onRemoveExpense(exp.id)}
                          className="text-zinc-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onAddExpense} className="space-y-2 pt-2 border-t border-[#1F2430]">
              <select
                disabled={tallySubmitted}
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                className="min-h-[40px] w-full bg-[#111318] border border-[#1F2430] rounded-lg px-3 text-xs text-white outline-none disabled:opacity-40"
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
                placeholder="Detail (e.g. Bill #)"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
                className="min-h-[40px] w-full bg-[#111318] border border-[#1F2430] rounded-lg px-3 text-xs text-white outline-none disabled:opacity-40"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  disabled={tallySubmitted}
                  placeholder="Amount (LKR)"
                  value={newExpenseAmt}
                  onChange={(e) => setNewExpenseAmt(e.target.value)}
                  className="min-h-[40px] flex-1 bg-[#111318] border border-[#1F2430] rounded-lg px-3 text-xs text-white font-mono text-right outline-none disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={tallySubmitted}
                  className="min-h-[40px] px-4 rounded-lg bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </form>
          </div>

          {/* Col 3: Reconciliation Summary */}
          <div className="lg:col-span-4 bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-4 flex flex-col justify-between gap-4">
            <div className="space-y-2 text-xs">
              <p className="text-xs font-medium text-zinc-400">Reconciliation</p>
              <div className="flex justify-between text-zinc-300">
                <span>Total Shift Sales</span>
                <span className="font-mono tabular-nums">{formatLKR2(shiftRevenue)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Opening Float</span>
                <span className="font-mono tabular-nums">+{formatLKR2(openingBalance)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Expected Cash Rev</span>
                <span className="font-mono tabular-nums">+{formatLKR2(expectedCashRevenue)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Operational Costs</span>
                <span className="font-mono tabular-nums">-{formatLKR2(totalExp)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#1F2430] font-semibold text-white">
                <span>Expected Closing</span>
                <span className="font-mono tabular-nums text-amber-400">
                  {formatLKR2(expectedClosingCash)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-white">
                <span>Actual Counted</span>
                <span className="font-mono tabular-nums">{formatLKR2(actualCash)}</span>
              </div>

              <div
                className={`mt-2 py-2 px-3 rounded-lg text-center font-medium ${
                  discrepancy === 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : discrepancy > 0
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {discrepancy === 0
                  ? "Balanced (Rs. 0.00 variance)"
                  : discrepancy > 0
                  ? `Overage: +${formatLKR2(discrepancy)}`
                  : `Shortage: -${formatLKR2(Math.abs(discrepancy))}`}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1F2430]">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total Shift Assets (Cash + Bank)</span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  {formatLKR2(totalClosingBalance)}
                </span>
              </div>
              {!tallySubmitted ? (
                <button
                  type="button"
                  onClick={onSubmitTally}
                  className="w-full min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold cursor-pointer transition"
                >
                  Submit &amp; Lock Shift Tally
                </button>
              ) : (
                <div className="w-full min-h-[44px] rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5">
                  <Lock size={14} /> Shift Tally Locked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter & Channel Breakdown */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">Period Performance</h3>
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#111318] border border-[#1F2430] gap-1">
          {[
            { id: "7_days", label: "7 Days" },
            { id: "14_days", label: "14 Days" },
            { id: "30_days", label: "30 Days" },
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "all_time", label: "All Time" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setReportFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                reportFilter === pill.id
                  ? "bg-[#F26F21] text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111318] border border-[#1F2430] rounded-xl p-4">
          <p className="text-xs text-zinc-400">Period Revenue</p>
          <div className="mt-1">
            {renderAdminMetric(
              formatLKR2(filteredReportOrders.reduce((s, o) => s + o.total, 0)),
              "text-lg font-semibold text-emerald-400 font-mono tabular-nums"
            )}
          </div>
        </div>
        <div className="bg-[#111318] border border-[#1F2430] rounded-xl p-4">
          <p className="text-xs text-zinc-400">Settled Orders</p>
          <p className="text-lg font-semibold text-white font-mono tabular-nums mt-1">
            {filteredReportOrders.length}
          </p>
        </div>
        <div className="bg-[#111318] border border-[#1F2430] rounded-xl p-4">
          <p className="text-xs text-zinc-400">POS / Direct / 3rd Party / Dine In</p>
          <p className="text-sm font-mono text-zinc-200 mt-1.5">
            {posOrders.length} / {directOrders.length} / {thirdPartyOrders.length} /{" "}
            {dineInOrders.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCms}
          className="bg-[#111318] border border-[#1F2430] hover:border-[#F26F21]/50 rounded-xl p-4 text-left transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-zinc-400">Customer CMS</p>
            <p className="text-lg font-semibold text-white font-mono tabular-nums mt-1">
              {customersCount} Profiles
            </p>
          </div>
          <Users size={18} className="text-[#F26F21]" />
        </button>
      </div>
        </>
      )}
    </div>
  );
}
