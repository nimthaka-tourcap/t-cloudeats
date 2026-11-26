"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Calculator, AlertCircle, Banknote, Landmark, Calendar, User, Phone } from "lucide-react";
import { CashierOrder, getBusinessDateStr, getTodayDateStr } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CashierOrder | null;
  currentBizDate?: string;
  onConfirmSplit: (
    orderId: string,
    cashAmount: number,
    bankAmount: number,
    settledBizDate: string
  ) => Promise<void> | void;
}

export default function SplitPaymentModal({
  isOpen,
  onClose,
  order,
  currentBizDate = getTodayDateStr(),
  onConfirmSplit,
}: SplitPaymentModalProps) {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      const total = order.total || 0;
      // If order already has split amounts, prepopulate them
      const prevCash = order.customer?.split_cash_amount;
      const prevBank = order.customer?.split_bank_amount;
      if (typeof prevCash === "number" && typeof prevBank === "number" && prevCash + prevBank === total) {
        setCashAmount(prevCash);
        setBankAmount(prevBank);
      } else {
        // Default to 50/50 split
        const half = Math.round((total / 2) * 100) / 100;
        setCashAmount(half);
        setBankAmount(Math.round((total - half) * 100) / 100);
      }
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const total = order.total || 0;
  const sum = Math.round((cashAmount + bankAmount) * 100) / 100;
  const diff = Math.round((total - sum) * 100) / 100;
  const isBalanced = Math.abs(diff) < 0.01;

  // Order date info
  const orderBizDate = order.timestamp ? order.timestamp.slice(0, 10) : "";
  const isPastOrder = orderBizDate && orderBizDate !== currentBizDate;

  const handleCashChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setCashAmount(val);
    setBankAmount(Math.max(0, Math.round((total - val) * 100) / 100));
  };

  const handleBankChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setBankAmount(val);
    setCashAmount(Math.max(0, Math.round((total - val) * 100) / 100));
  };

  const handlePreset = (type: "half" | "all_cash" | "all_bank") => {
    if (type === "half") {
      const half = Math.round((total / 2) * 100) / 100;
      setCashAmount(half);
      setBankAmount(Math.round((total - half) * 100) / 100);
    } else if (type === "all_cash") {
      setCashAmount(total);
      setBankAmount(0);
    } else if (type === "all_bank") {
      setCashAmount(0);
      setBankAmount(total);
    }
  };

  const handleConfirm = async () => {
    if (!isBalanced) return;
    setIsSubmitting(true);
    try {
      await onConfirmSplit(order.id, cashAmount, bankAmount, currentBizDate);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Split Bill Payment
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {order.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Customer & Date Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                <User size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{order.customer?.name || "Customer"}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 font-mono">
                <Phone size={12} className="text-slate-400 shrink-0" />
                <span>{order.customer?.phone || "-"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>Original Order Date: <strong className="font-mono text-slate-700">{orderBizDate}</strong></span>
              </div>
              {isPastOrder && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  Past Credit Bill
                </span>
              )}
            </div>
          </div>

          {/* Past Credit Order Notice */}
          {isPastOrder && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-900 space-y-1">
              <p className="font-bold">
                ✓ Settling into Active Shift: {currentBizDate}
              </p>
              <p className="text-sky-700 leading-relaxed">
                The Cash portion will be credited into <strong>Today&apos;s Cash Drawer</strong>, and Bank portion into <strong>Today&apos;s Bank Transfers</strong> so your daily tally balances accurately.
              </p>
            </div>
          )}

          {/* Total Bill Amount Display */}
          <div className="text-center py-2 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">Total Amount Due</span>
            <span className="text-2xl font-black font-mono text-slate-950">
              {formatLKR2(total)}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePreset("half")}
              className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
            >
              50% / 50%
            </button>
            <button
              type="button"
              onClick={() => handlePreset("all_cash")}
              className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition cursor-pointer"
            >
              100% Cash
            </button>
            <button
              type="button"
              onClick={() => handlePreset("all_bank")}
              className="py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-[11px] transition cursor-pointer"
            >
              100% Bank
            </button>
          </div>

          {/* Dual Inputs */}
          <div className="space-y-3 pt-1">
            {/* Cash Input */}
            <div>
              <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <Banknote size={14} className="text-emerald-600" />
                <span>Cash Portion (LKR)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cashAmount || ""}
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-mono font-bold text-slate-900 text-right outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Bank Transfer Input */}
            <div>
              <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <Landmark size={14} className="text-sky-600" />
                <span>Account / Bank Transfer Portion (LKR)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={bankAmount || ""}
                  onChange={(e) => handleBankChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-mono font-bold text-slate-900 text-right outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                />
              </div>
            </div>
          </div>

          {/* Balance / Remaining Pill */}
          <div
            className={`py-2 px-3 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
              isBalanced
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {isBalanced ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span>Perfect! Split matches total ({formatLKR2(total)})</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} className="text-rose-600" />
                <span>
                  {diff > 0
                    ? `Remaining to allocate: ${formatLKR2(diff)}`
                    : `Over allocated by: ${formatLKR2(Math.abs(diff))}`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isBalanced || isSubmitting}
            onClick={handleConfirm}
            className="min-h-[40px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition shadow-md"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <span>Confirm &amp; Settle Bill</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
