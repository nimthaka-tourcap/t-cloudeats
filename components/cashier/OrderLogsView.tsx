"use client";

import React, { useState, useEffect, useRef } from "react";
import { RotateCw, WifiOff, Lock, EyeOff, TrendingUp, Printer } from "lucide-react";
import { CashierOrder } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";

interface OrderLogsViewProps {
  selectedLogDate: string;
  setSelectedLogDate: (d: string) => void;
  todaysOrders: CashierOrder[];
  todaysAllOrders: CashierOrder[];
  loadingOrders: boolean;
  customers: { phone: string; name: string; address: string }[];
  isToday: boolean;
  isAdminUnlocked: boolean;
  focusedOrderIndex?: number;
  onUnlockPinForPrices: () => void;
  onPaymentStatusChange: (orderId: string, status: "Paid" | "Not Paid") => void;
  onLoadOrder: (orderId: string) => void;
  onVoidOrder: (orderId: string) => void;
  onReprintOrder: (order: CashierOrder) => void;
  renderAdminMetric: (val: string, cls: string) => React.ReactNode;
}

export default function OrderLogsView({
  selectedLogDate,
  setSelectedLogDate,
  todaysOrders,
  todaysAllOrders,
  loadingOrders,
  customers,
  isToday,
  isAdminUnlocked,
  focusedOrderIndex = -1,
  onUnlockPinForPrices,
  onPaymentStatusChange,
  onLoadOrder,
  onVoidOrder,
  onReprintOrder,
  renderAdminMetric,
}: OrderLogsViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    if (focusedOrderIndex >= 0 && rowRefs.current[focusedOrderIndex]) {
      rowRefs.current[focusedOrderIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedOrderIndex]);

  const visibleOrders =
    statusFilter === "ALL"
      ? todaysAllOrders
      : todaysAllOrders.filter((o) => o.status === statusFilter);

  const totalRev = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = todaysOrders.length > 0 ? totalRev / todaysOrders.length : 0;

  return (
    <div className="space-y-6">
      {/* Shift Sales Summary */}
      <div className="bg-[#111318] border border-[#1F2430] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <TrendingUp size={16} className="text-[#F26F21]" />
            <span>Shift Sales Summary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Business Date:</span>
            <input
              type="date"
              value={selectedLogDate}
              onChange={(e) => setSelectedLogDate(e.target.value)}
              className="min-h-[44px] bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none focus:border-[#F26F21] font-mono"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-4">
            <p className="text-xs text-zinc-400">Shift Orders</p>
            <p className="text-xl font-semibold text-white font-mono tabular-nums mt-1">
              {todaysOrders.length}
            </p>
          </div>
          <div className="bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-4">
            <p className="text-xs text-zinc-400">Shift Revenue</p>
            <div className="mt-1">
              {renderAdminMetric(
                formatLKR2(totalRev),
                "text-xl font-semibold text-emerald-400 font-mono tabular-nums"
              )}
            </div>
          </div>
          <div className="bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-4">
            <p className="text-xs text-zinc-400">Avg Ticket Size</p>
            <div className="mt-1">
              {renderAdminMetric(
                formatLKR2(avgTicket),
                "text-xl font-semibold text-white font-mono tabular-nums"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#111318] border border-[#1F2430] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2430] flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">
            Shift Orders ({visibleOrders.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "Preparing", "Ready", "Dispatched", "Completed", "Voided"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  statusFilter === st
                    ? "bg-sky-500 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loadingOrders && todaysAllOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
            <RotateCw className="animate-spin text-[#F26F21]" size={20} />
            <span>Loading shift orders...</span>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            No orders found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1F2430] text-zinc-400 bg-[#0A0B0F]">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430]">
                {visibleOrders.map((order, idx) => {
                  const isRowFocused = focusedOrderIndex === idx;
                  const rawStatus =
                    order.customer?.payment_status || (order as any).payment_status || "Paid";
                  const paymentStatus = rawStatus === "Not Paid" ? "Not Paid" : "Paid";
                  const isPaid = paymentStatus === "Paid";
                  const isVoidOrIgnored =
                    order.status === "Voided" || order.status === "Ignored";
                  const cust = order.customer
                    ? customers.find((x) => x.phone === order.customer?.phone)
                    : null;

                  return (
                    <tr
                      key={order.id}
                      ref={(el) => {
                        rowRefs.current[idx] = el;
                      }}
                      className={`hover:bg-white/[0.02] ${isRowFocused ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/70" : ""
                        }`}
                    >
                      <td className="px-4 py-3 font-mono text-white">
                        <div className="flex flex-col gap-1">
                          <span>
                            {order.status === "Ignored" || order.id.startsWith("IGNORED-")
                              ? "-"
                              : order.id}
                          </span>
                          {order.syncedToDb === false && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <WifiOff size={11} /> Local Only
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono">
                        {new Date(order.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {order.customer ? (
                          <div>
                            <p className="text-white font-medium">
                              {cust ? cust.name : order.customer.name}
                            </p>
                            <p className="text-zinc-500 font-mono">{order.customer.phone}</p>
                            {order.customer.payment_receipt && (
                              <button
                                type="button"
                                onClick={() => {
                                  const w = window.open();
                                  w?.document.write(
                                    `<html><body style="margin:0;background:#0A0B0F;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${order.customer?.payment_receipt}" style="max-width:90%;max-height:90vh;object-fit:contain;border-radius:8px;" /></body></html>`
                                  );
                                }}
                                className="text-emerald-400 underline text-xs mt-0.5 cursor-pointer"
                              >
                                View Slip
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500">Walk-in</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{order.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium ${order.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : order.status === "Voided"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                            }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={paymentStatus}
                          disabled={isVoidOrIgnored}
                          onChange={(e) =>
                            onPaymentStatusChange(
                              order.id,
                              e.target.value as "Paid" | "Not Paid"
                            )
                          }
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-[#0A0B0F] outline-none cursor-pointer disabled:opacity-40 ${isPaid
                            ? "border-emerald-500/30 text-emerald-400"
                            : "border-rose-500/40 text-rose-400"
                            }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Not Paid">Not Paid</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {isToday || isAdminUnlocked ? (
                          <span>
                            {order.items.reduce((s, i) => s + i.quantity, 0)} items
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-500">
                            <Lock size={12} /> Locked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-white">
                        {isToday || isAdminUnlocked ? (
                          formatLKR2(order.total)
                        ) : (
                          <button
                            type="button"
                            onClick={onUnlockPinForPrices}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0A0B0F] border border-[#1F2430] text-zinc-400 hover:text-white cursor-pointer"
                          >
                            •••• <EyeOff size={12} />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onReprintOrder(order)}
                            className="min-h-[36px] px-2.5 rounded-lg bg-[#0A0B0F] border border-[#1F2430] text-zinc-300 hover:text-white cursor-pointer"
                            title="Print Receipt / KOT"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onLoadOrder(order.id)}
                            className="min-h-[36px] px-3 rounded-lg bg-[#1C1F26] hover:bg-[#F26F21] text-white text-xs font-medium cursor-pointer transition"
                          >
                            Edit
                          </button>
                          {!isVoidOrIgnored && (
                            <button
                              type="button"
                              onClick={() => onVoidOrder(order.id)}
                              className="min-h-[36px] px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-medium cursor-pointer transition"
                            >
                              Void
                            </button>
                          )}
                        </div>
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
