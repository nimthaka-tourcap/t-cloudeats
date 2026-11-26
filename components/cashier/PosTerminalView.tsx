"use client";

import React, { useEffect, useRef } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { CashierMenuItem } from "@/lib/cashier/types";
import { formatLKR } from "@/lib/utils/currency";

interface PosTerminalViewProps {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  filteredMenuItems: CashierMenuItem[];
  cartQuantities?: Record<number, number>;
  focusedIndex?: number;
  isGridFocused?: boolean;
  justAddedId?: number | null;
  gridRef?: React.RefObject<HTMLDivElement | null>;
  onAddToCart: (item: CashierMenuItem) => void;
  onOpenCustomItem: () => void;
  unclosedPastShiftInfo: { formattedDate: string } | null;
  onSettlePastShift: (formattedDate: string) => void;
}

export default function PosTerminalView({
  categories,
  activeCategory,
  setActiveCategory,
  filteredMenuItems,
  cartQuantities = {},
  focusedIndex = 0,
  isGridFocused = true,
  justAddedId = null,
  gridRef,
  onAddToCart,
  onOpenCustomItem,
  unclosedPastShiftInfo,
  onSettlePastShift,
}: PosTerminalViewProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isGridFocused && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusedIndex, isGridFocused]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Clean White Category Filter Strip */}
      <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto shrink-0 border-b border-slate-200 bg-white">
        {categories.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                active
                  ? "bg-sky-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Crisp White Menu Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {unclosedPastShiftInfo && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Previous Shift Tally Unsettled
                </p>
                <p className="text-xs text-amber-700">
                  Shift on <strong className="font-mono">{unclosedPastShiftInfo.formattedDate}</strong> must be closed before taking new orders.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSettlePastShift(unclosedPastShiftInfo.formattedDate)}
              className="min-h-[44px] px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              Settle Shift Tally →
            </button>
          </div>
        )}

        <div
          ref={gridRef}
          className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
        >
          {filteredMenuItems.map((item, idx) => {
            const qtyInCart = cartQuantities[item.id] || 0;
            const isFocused = isGridFocused && focusedIndex === idx;
            const isPulsing = justAddedId === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => onAddToCart(item)}
                className={`relative group bg-white border border-slate-200 hover:border-sky-400 hover:shadow-sm rounded-xl p-4 text-left flex flex-col justify-between gap-3 min-h-[108px] transition cursor-pointer active:scale-[0.98] ${
                  isFocused ? "ring-2 ring-sky-500 border-sky-500 bg-sky-50/40" : ""
                } ${isPulsing ? "scale-[0.97] ring-2 ring-emerald-500" : ""}`}
              >
                {qtyInCart > 0 && (
                  <span className="absolute top-3 right-3 min-w-[24px] h-6 px-1.5 rounded-full bg-sky-500 text-white text-xs font-semibold font-mono flex items-center justify-center">
                    {qtyInCart}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition line-clamp-2 leading-snug pr-6">
                  {item.title}
                </h3>
                <span className="text-sm font-semibold font-mono tabular-nums text-slate-600">
                  {formatLKR(item.price)}
                </span>
              </button>
            );
          })}

          {/* Custom / Special Order Tile */}
          <button
            type="button"
            onClick={onOpenCustomItem}
            className="group bg-white border border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-4 text-left flex flex-col justify-between gap-3 min-h-[108px] transition cursor-pointer"
          >
            <h3 className="text-sm font-semibold text-slate-700 group-hover:text-sky-600">
              + Custom Order
            </h3>
            <span className="text-xs text-sky-600 font-medium flex items-center gap-1">
              <Plus size={14} /> Open Price
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
