"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, ShoppingBag, FileText, User } from "lucide-react";
import { CashierMenuItem, CashierOrder } from "@/lib/cashier/types";
import { formatLKR } from "@/lib/utils/currency";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: CashierMenuItem[];
  orders: CashierOrder[];
  customers: { phone: string; name: string; address: string }[];
  onSelectMenuItem: (item: CashierMenuItem) => void;
  onSelectOrder: (order: CashierOrder) => void;
  onSelectCustomer: (customer: { phone: string; name: string; address: string }) => void;
}

export default function QuickSearchModal({
  isOpen,
  onClose,
  menuItems,
  orders,
  customers,
  onSelectMenuItem,
  onSelectOrder,
  onSelectCustomer,
}: QuickSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        menu: menuItems.slice(0, 6),
        orders: orders.slice(0, 4),
        customers: customers.slice(0, 4),
      };
    }
    return {
      menu: menuItems
        .filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q) ||
            (m.sku && m.sku.toLowerCase().includes(q))
        )
        .slice(0, 6),
      orders: orders
        .filter(
          (o) =>
            o.id.toLowerCase().includes(q) ||
            (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
            (o.customer?.phone && o.customer.phone.includes(q))
        )
        .slice(0, 5),
      customers: customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.address && c.address.toLowerCase().includes(q))
        )
        .slice(0, 5),
    };
  }, [query, menuItems, orders, customers]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results.menu.length > 0) {
          onSelectMenuItem(results.menu[0]);
          onClose();
        } else if (results.orders.length > 0) {
          onSelectOrder(results.orders[0]);
          onClose();
        } else if (results.customers.length > 0) {
          onSelectCustomer(results.customers[0]);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, results, onSelectMenuItem, onSelectOrder, onSelectCustomer]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-16 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items, INV-YYMMDD-XXX, or customer phone..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-200">
          {/* Menu Matches */}
          {results.menu.length > 0 && (
            <div className="p-3 space-y-1">
              <p className="px-2 text-xs font-medium text-slate-500">Menu Items (Click to Add to Cart)</p>
              {results.menu.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectMenuItem(item);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShoppingBag size={14} className="text-sky-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-sm font-medium text-slate-900">{item.title}</span>
                      <span className="text-xs text-slate-500 ml-2">{item.category}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-700 shrink-0">
                    {formatLKR(item.price)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Order Matches */}
          {results.orders.length > 0 && (
            <div className="p-3 space-y-1">
              <p className="px-2 text-xs font-medium text-slate-500">Orders</p>
              {results.orders.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    onSelectOrder(ord);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={14} className="text-sky-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-sm font-mono text-slate-900">{ord.id}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {ord.customer?.name || "Customer"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-600 shrink-0">
                    {formatLKR(ord.total)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Customer Matches */}
          {results.customers.length > 0 && (
            <div className="p-3 space-y-1">
              <p className="px-2 text-xs font-medium text-slate-500">Customers</p>
              {results.customers.map((c) => (
                <button
                  key={c.phone}
                  type="button"
                  onClick={() => {
                    onSelectCustomer(c);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User size={14} className="text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-sm font-medium text-slate-900">{c.name}</span>
                      <span className="text-xs font-mono text-slate-500 ml-2">{c.phone}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
