"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { RotateCw, WifiOff, Lock, EyeOff, TrendingUp, Printer, ChevronLeft, ChevronRight, Eye, ExternalLink, Download, X, Maximize2, Minimize2, Plus } from "lucide-react";
import { CashierOrder, stepDateStr, getTodayDateStr, getOrderPaymentMode, OrderPaymentMode } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";
import { isPdfReceipt, openReceiptSlip, downloadReceiptSlip, createReceiptBlobUrl } from "@/lib/utils/receipt-slip";

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
  onPaymentStatusChange: (orderId: string, status: OrderPaymentMode | "Paid" | "Not Paid") => void;
  onLoadOrder: (orderId: string) => void;
  onVoidOrder: (orderId: string) => void;
  onReprintOrder: (order: CashierOrder) => void;
  renderAdminMetric: (val: string, cls: string) => React.ReactNode;
  onRefreshOrders?: () => void;
  onAddOrderForDate?: (dateStr: string) => void;
  allOrders?: CashierOrder[];
  onOpenSplitModal?: (order: CashierOrder) => void;
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
  onRefreshOrders,
  onAddOrderForDate,
  allOrders,
  onOpenSplitModal,
}: OrderLogsViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewingSlip, setViewingSlip] = useState<{
    receipt: string;
    filename?: string;
    customerName?: string;
    orderId?: string;
  } | null>(null);
  const [isSlipFullScreen, setIsSlipFullScreen] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");

  useEffect(() => {
    if (viewingSlip && isPdfReceipt(viewingSlip.receipt, viewingSlip.filename)) {
      const url = createReceiptBlobUrl(viewingSlip.receipt);
      setPdfBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfBlobUrl("");
    }
  }, [viewingSlip]);

  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    if (focusedOrderIndex >= 0 && rowRefs.current[focusedOrderIndex]) {
      rowRefs.current[focusedOrderIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedOrderIndex]);

  const allPendingCreditOrders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(
      (o) =>
        o.status !== "Voided" &&
        o.status !== "Ignored" &&
        getOrderPaymentMode(o) === "Credit"
    );
  }, [allOrders]);

  const visibleOrders =
    statusFilter === "ALL"
      ? todaysAllOrders
      : statusFilter === "PENDING_CREDIT"
      ? allPendingCreditOrders
      : todaysAllOrders.filter((o) => o.status === statusFilter);

  const totalRev = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = todaysOrders.length > 0 ? totalRev / todaysOrders.length : 0;

  return (
    <div className="space-y-6">
      {/* Shift Sales Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <TrendingUp size={16} className="text-sky-600" />
            <span>Shift Sales Summary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Business Date:</span>
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
                className="bg-transparent border-0 px-2 text-sm text-slate-900 outline-none font-mono cursor-pointer"
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
                className="h-[38px] px-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-medium transition cursor-pointer"
                title="Jump to Today"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-600">Shift Orders</p>
            <p className="text-xl font-semibold text-slate-900 font-mono tabular-nums mt-1">
              {todaysOrders.length}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-600">Shift Revenue</p>
            <div className="mt-1">
              {renderAdminMetric(
                formatLKR2(totalRev),
                "text-xl font-semibold text-emerald-700 font-mono tabular-nums"
              )}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-600">Avg Ticket Size</p>
            <div className="mt-1">
              {renderAdminMetric(
                formatLKR2(avgTicket),
                "text-xl font-semibold text-slate-900 font-mono tabular-nums"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Shift Orders ({visibleOrders.length})
            </h3>
            {onRefreshOrders && (
              <button
                type="button"
                onClick={onRefreshOrders}
                disabled={loadingOrders}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 active:scale-95 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                title={`Update & refresh order list on ${selectedLogDate}`}
              >
                <RotateCw size={13} className={loadingOrders ? "animate-spin text-sky-600" : "text-sky-600"} />
                <span>Update Order List</span>
              </button>
            )}
            {onAddOrderForDate && (
              <button
                type="button"
                onClick={() => onAddOrderForDate(selectedLogDate)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/20 active:scale-95 text-xs font-bold transition cursor-pointer"
                title={`Add a new order recorded on this date (${selectedLogDate})`}
              >
                <Plus size={13} />
                <span>Add Order to this Date</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "Preparing", "Ready", "Dispatched", "Completed", "Voided"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${statusFilter === st
                  ? "bg-sky-500 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                {st}
              </button>
            ))}
            {allPendingCreditOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING_CREDIT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${statusFilter === "PENDING_CREDIT"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                  }`}
                title="View all pending credit bills across all dates"
              >
                <span>Pending Credit ({allPendingCreditOrders.length})</span>
              </button>
            )}
          </div>
        </div>

        {loadingOrders && todaysAllOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-600 flex flex-col items-center gap-2">
            <RotateCw className="animate-spin text-sky-600" size={20} />
            <span>Loading shift orders...</span>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No orders found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
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
              <tbody className="divide-y divide-slate-200">
                {visibleOrders.map((order, idx) => {
                  const isRowFocused = focusedOrderIndex === idx;
                  const paymentMode = getOrderPaymentMode(order);
                  const rawStatus =
                    order.customer?.payment_status || (order as any).payment_status || "Paid";
                  const paymentStatus = rawStatus === "Not Paid" ? "Not Paid" : "Paid";
                  const isPaid = paymentMode !== "Credit";
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
                      className={`hover:bg-slate-50 ${isRowFocused ? "bg-sky-50 ring-1 ring-inset ring-sky-400" : ""
                        }`}
                    >
                      <td className="px-4 py-3 font-mono text-slate-900 font-medium">
                        <div className="flex flex-col gap-1">
                          <span>
                            {order.status === "Ignored" || order.id.startsWith("IGNORED-")
                              ? "-"
                              : order.id}
                          </span>
                          {order.syncedToDb === false && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <WifiOff size={11} /> Local Only
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {new Date(order.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {order.customer ? (
                          <div>
                            <p className="text-slate-900 font-medium">
                              {cust ? cust.name : order.customer.name}
                            </p>
                            <p className="text-slate-500 font-mono">{order.customer.phone}</p>
                            {order.customer.payment_receipt && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSlipFullScreen(false);
                                    setViewingSlip({
                                      receipt: order.customer!.payment_receipt!,
                                      filename: order.customer?.payment_receipt_filename,
                                      customerName: cust ? cust.name : order.customer?.name,
                                      orderId: order.id,
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium underline text-xs cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>View Slip</span>
                                  {isPdfReceipt(order.customer.payment_receipt, order.customer.payment_receipt_filename) && (
                                    <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded font-mono">PDF</span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReceiptSlip(order.customer!.payment_receipt!, order.customer?.payment_receipt_filename)}
                                  className="p-0.5 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                                  title="Open in new full tab"
                                >
                                  <ExternalLink size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">Walk-in</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium border ${order.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.status === "Voided"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <select
                            value={paymentMode}
                            disabled={isVoidOrIgnored}
                            onChange={(e) => {
                              const val = e.target.value as OrderPaymentMode;
                              if (val === "Split") {
                                onOpenSplitModal ? onOpenSplitModal(order) : onPaymentStatusChange(order.id, "Split");
                              } else {
                                onPaymentStatusChange(order.id, val);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-white outline-none cursor-pointer disabled:opacity-40 transition-colors ${
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

                          {paymentMode === "Credit" && (
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
                      <td className="px-4 py-3 text-slate-700">
                        {isToday || isAdminUnlocked ? (
                          <span>
                            {order.items.reduce((s, i) => s + i.quantity, 0)} items
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Lock size={12} /> Locked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-medium text-slate-900">
                        {isToday || isAdminUnlocked ? (
                          formatLKR2(order.total)
                        ) : (
                          <button
                            type="button"
                            onClick={onUnlockPinForPrices}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
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
                            className="min-h-[36px] px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            title="Print Receipt / KOT"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onLoadOrder(order.id)}
                            className="min-h-[36px] px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
                            title="Edit this order or add new items to it"
                          >
                            Edit / Add Items
                          </button>
                          {!isVoidOrIgnored && (
                            <button
                              type="button"
                              onClick={() => onVoidOrder(order.id)}
                              className="min-h-[36px] px-3 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-medium cursor-pointer transition"
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
      {/* Slip Preview Modal */}
      {viewingSlip && (
        <div className={`fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center ${isSlipFullScreen ? "p-0" : "p-3 sm:p-5"}`}>
          <div className={`bg-white border border-slate-200 overflow-hidden shadow-2xl flex flex-col transition-all duration-200 ${
            isSlipFullScreen ? "w-screen h-screen rounded-none" : "w-[96vw] max-w-6xl h-[92vh] rounded-2xl"
          }`}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    Payment Slip • {viewingSlip.orderId}
                  </h3>
                  {isPdfReceipt(viewingSlip.receipt, viewingSlip.filename) && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 font-bold">PDF</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {viewingSlip.customerName || "Customer"} • {viewingSlip.filename || (isPdfReceipt(viewingSlip.receipt, viewingSlip.filename) ? "Payment_Slip.pdf" : "Payment_Slip.jpg")}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openReceiptSlip(viewingSlip.receipt, viewingSlip.filename)}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Open in a dedicated full browser tab"
                >
                  <ExternalLink size={14} />
                  <span>Open Full Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadReceiptSlip(viewingSlip.receipt, viewingSlip.filename)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Download File"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSlipFullScreen(!isSlipFullScreen)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                  title={isSlipFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isSlipFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingSlip(null);
                    setIsSlipFullScreen(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full h-full overflow-hidden bg-slate-900 flex items-stretch relative">
              {isPdfReceipt(viewingSlip.receipt, viewingSlip.filename) ? (
                pdfBlobUrl ? (
                  <iframe
                    src={`${pdfBlobUrl}#navpanes=0&toolbar=1&view=FitH&zoom=page-width`}
                    className="w-full h-full border-0 bg-slate-900"
                    title="Payment Slip PDF"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Loading PDF document...
                  </div>
                )
              ) : (
                <div className="w-full h-full p-4 overflow-auto flex items-center justify-center bg-slate-950/90">
                  <img
                    src={viewingSlip.receipt}
                    alt="Payment Slip"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
