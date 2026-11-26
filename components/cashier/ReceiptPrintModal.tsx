"use client";

import React, { useState, useEffect } from "react";
import { Printer, X, WifiOff, Copy, ExternalLink, ChefHat, Receipt } from "lucide-react";
import { CashierOrder, getItemUnitPrice, getBillHash, getBillUrl } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";
import { STORE_CONFIG } from "@/lib/constants/store";

interface ReceiptPrintModalProps {
  order: CashierOrder;
  customers: { phone: string; name: string; address: string }[];
  onClose: () => void;
  onConfirmPrint: () => void;
  onOpenBill: (urlPath: string) => void;
  onToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function ReceiptPrintModal({
  order,
  customers,
  onClose,
  onConfirmPrint,
  onOpenBill,
  onToast,
}: ReceiptPrintModalProps) {
  const [printMode, setPrintMode] = useState<"RECEIPT" | "KOT">("RECEIPT");
  const [paperSize, setPaperSize] = useState<"80mm" | "58mm">("80mm");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onConfirmPrint();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Backspace" && !isInput) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onConfirmPrint]);

  const resolvedCustomerName = (() => {
    const found = customers.find((x) => x.phone === order.customer?.phone);
    return found ? found.name : order.customer?.name || "Walk-in Customer";
  })();

  const isLocalOnly = order.syncedToDb === false;
  const billUrl = getBillUrl(order.id);
  const waMsg = `Hi ${resolvedCustomerName},\n\nThank you for your order! We are preparing it now and hope you enjoy your meal.\n\nYou can view your bill and track your order status here:\n${billUrl}\n\nHave a great day!\n\nBest regards,\nthe t-cloud eats Team`;

  const orderTypeLabel =
    order.type === "Dine In"
      ? "DINE IN ORDER"
      : order.type === "Take Away" || order.type === "POS"
      ? "POS / TAKE AWAY"
      : order.type === "Pick Up" || order.type === "3rd Party"
      ? "3RD PARTY (UBER / PICKME)"
      : "DIRECT DELIVERY";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-[#1F2430] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header (No-Print) */}
        <div className="no-print px-5 py-3.5 border-b border-[#1F2430] flex items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-lg bg-[#0A0B0F] border border-[#1F2430]">
            <button
              type="button"
              onClick={() => setPrintMode("RECEIPT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                printMode === "RECEIPT" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Receipt size={14} /> Customer Receipt
            </button>
            <button
              type="button"
              onClick={() => setPrintMode("KOT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                printMode === "KOT" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <ChefHat size={14} /> Kitchen KOT
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as "80mm" | "58mm")}
              className="bg-[#0A0B0F] border border-[#1F2430] rounded-lg px-2 py-1 text-xs text-zinc-300 outline-none"
            >
              <option value="80mm">80mm</option>
              <option value="58mm">58mm</option>
            </select>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Thermal Print Preview Area */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#0A0B0F] flex justify-center">
          <div
            className={`thermal-print-area ${
              paperSize === "58mm" ? "thermal-58mm max-w-[260px]" : "max-w-[330px]"
            } w-full bg-white text-slate-900 rounded-xl p-5 font-mono text-xs space-y-3 shadow-lg`}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-2.5">
              <h3 className="font-bold text-sm uppercase tracking-wide">{STORE_CONFIG.name}</h3>
              {printMode === "RECEIPT" ? (
                <>
                  <p className="text-[11px] text-slate-600">{STORE_CONFIG.address}</p>
                  <p className="text-[11px] text-slate-600">Tel: {STORE_CONFIG.phone}</p>
                </>
              ) : (
                <p className="text-xs font-bold uppercase mt-1">*** KITCHEN ORDER TICKET ***</p>
              )}
              <p className="text-[11px] font-bold mt-1.5">Order: {order.id}</p>
              <p className="text-[11px] text-slate-600">
                {new Date(order.timestamp).toLocaleString("en-LK", { timeZone: "Asia/Colombo" })}
              </p>
              <div className="mt-1 inline-block px-2 py-0.5 border border-slate-400 rounded text-[10px] font-bold">
                {orderTypeLabel} • {order.status.toUpperCase()}
              </div>
            </div>

            {/* Customer */}
            {order.customer && (
              <div className="border-b border-dashed border-slate-300 pb-2.5 text-[11px] space-y-0.5">
                <p><span className="font-bold">Customer:</span> {resolvedCustomerName}</p>
                {printMode === "RECEIPT" && order.customer.phone && (
                  <p><span className="font-bold">Phone:</span> {order.customer.phone}</p>
                )}
                {order.customer.address && (
                  <p><span className="font-bold">Address:</span> {order.customer.address}</p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-2.5">
              {order.items.map((item, idx) => {
                const itemTitle = item.menuItem ? item.menuItem.title : (item as any).title;
                const unitPrice = getItemUnitPrice(item);
                const itemTotal = unitPrice * item.quantity;
                const basePrice =
                  (item.menuItem ? item.menuItem.price : (item as any).price || 0) +
                  (item.addonPrice || 0);
                const isDiscounted =
                  item.isFree ||
                  (item.customItemPrice !== undefined &&
                    item.customItemPrice !==
                      (item.menuItem ? item.menuItem.price : (item as any).price || 0));

                return (
                  <div key={`${idx}-${itemTitle}`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold">
                        {item.quantity}x {itemTitle}
                      </span>
                      {printMode === "RECEIPT" && (
                        <div className="text-right tabular-nums shrink-0">
                          {isDiscounted && (
                            <span className="line-through text-[10px] text-slate-400 mr-1.5">
                              {formatLKR2(basePrice * item.quantity)}
                            </span>
                          )}
                          <span>{formatLKR2(itemTotal)}</span>
                        </div>
                      )}
                    </div>
                    {item.comment && (
                      <p className="text-[11px] italic pl-3">Note: {item.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals (Receipt Only) */}
            {printMode === "RECEIPT" && (
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatLKR2(order.subtotal)}</span>
                </div>
                {order.customer?.discount_amount && order.customer.discount_amount > 0 ? (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatLKR2(order.customer.discount_amount)}</span>
                  </div>
                ) : null}
                {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="tabular-nums">{formatLKR2(order.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-slate-300">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{formatLKR2(order.total)}</span>
                </div>
                <p className="text-center text-[10px] text-slate-500 pt-2">
                  Thank you for ordering with {STORE_CONFIG.name}!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* E-Bill & Print Actions (No-Print) */}
        <div className="no-print p-4 border-t border-[#1F2430] space-y-3 bg-[#111318]">
          {/* E-Bill Bar */}
          <div className="bg-[#0A0B0F] border border-[#1F2430] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Digital E-Bill</span>
              {isLocalOnly && (
                <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                  <WifiOff size={12} /> Sync Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={billUrl}
                className="flex-1 bg-[#111318] border border-[#1F2430] rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-400 truncate outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (isLocalOnly) {
                    onToast("Order is saved locally. Link activates once synced.", "warning");
                  }
                  navigator.clipboard.writeText(billUrl);
                  onToast("E-Bill URL copied!", "success");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#1C1F26] hover:bg-white/10 text-zinc-200 text-xs font-medium cursor-pointer flex items-center gap-1"
              >
                <Copy size={12} /> Copy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLocalOnly) {
                    onToast("Cloud bill unlocks once synced.", "warning");
                    return;
                  }
                  onOpenBill(`/bills/${order.id}${getBillHash(order.id)}`);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#1C1F26] hover:bg-white/10 text-zinc-200 text-xs font-medium cursor-pointer flex items-center gap-1"
              >
                <ExternalLink size={12} /> Open
              </button>
              {isLocalOnly ? (
                <button
                  type="button"
                  onClick={() =>
                    onToast("WhatsApp sharing activates once synced with the cloud database.", "warning")
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-500 text-xs font-medium cursor-not-allowed"
                >
                  WhatsApp
                </button>
              ) : (
                <a
                  href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-medium"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl bg-[#0A0B0F] border border-[#1F2430] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
            >
              Close (Esc)
            </button>
            <button
              type="button"
              onClick={onConfirmPrint}
              className="flex-[2] min-h-[44px] rounded-xl bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={15} />
              Print {printMode === "KOT" ? "KOT" : "Invoice"} ({paperSize})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
