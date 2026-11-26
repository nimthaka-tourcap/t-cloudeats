"use client";

import React, { useState, useEffect } from "react";
import { X, Merge } from "lucide-react";

interface MergeDishesModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDishTitles: { title: string; category?: string; price?: number }[];
  categories: string[];
  onMerged: (summary: string) => void;
}

export default function MergeDishesModal({
  isOpen,
  onClose,
  availableDishTitles,
  categories,
  onMerged,
}: MergeDishesModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [category, setCategory] = useState(
    categories.find((c) => c !== "All Categories") || "Fried Rice"
  );
  const [portion, setPortion] = useState("Regular");
  const [unifyHistoricalOrders, setUnifyHistoricalOrders] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleDish = (title: string) => {
    setSelected((prev) => {
      const next = prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title];
      if (!newTitle && next.length > 0) {
        setNewTitle(next[0]);
        const found = availableDishTitles.find((d) => d.title === next[0]);
        if (found?.price) setNewPrice(String(found.price));
        if (found?.category) setCategory(found.category);
      }
      return next;
    });
  };

  const filteredDishes = search.trim()
    ? availableDishTitles.filter((d) =>
        d.title.toLowerCase().includes(search.trim().toLowerCase())
      )
    : availableDishTitles;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (selected.length < 2) {
      setError("Select at least 2 dishes to merge.");
      return;
    }
    if (!newTitle.trim() || Number(newPrice) < 0 || newPrice === "") {
      setError("Enter a unified dish name and valid price.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/menu/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTitles: selected,
          newTitle: newTitle.trim(),
          newPrice: Number(newPrice),
          category,
          portion,
          unifyHistoricalOrders,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Merge failed");
      setSelected([]);
      setNewTitle("");
      setNewPrice("");
      onMerged(
        `Merged ${selected.length} dishes into "${newTitle.trim()}" (${data.ordersUpdated} past orders unified).`
      );
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-[#111318] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
      >
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Merge size={16} className="text-[#F26F21]" />
            <h3 className="text-sm font-semibold text-white">Merge &amp; Consolidate Dishes</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <p className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Step 1: Select 2+ Dishes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-medium">
                1. Select 2 or more dishes to merge ({selected.length} selected)
              </label>
              <input
                type="text"
                placeholder="Filter dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
              />
            </div>

            <div className="max-h-44 overflow-y-auto bg-[#0A0B0F] border border-white/[0.06] rounded-xl divide-y divide-white/[0.05]">
              {filteredDishes.map((d) => {
                const isChecked = selected.includes(d.title);
                return (
                  <label
                    key={d.title}
                    className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-white/[0.02] ${
                      isChecked ? "bg-[#F26F21]/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDish(d.title)}
                        className="accent-[#F26F21]"
                      />
                      <span className="text-white font-medium">{d.title}</span>
                    </div>
                    <span className="text-zinc-500">{d.category || "Menu / Order"}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Step 2: New Unified Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">2. New Unified Dish Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicken Fried Rice"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="min-h-[44px] w-full bg-[#0A0B0F] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white outline-none focus:border-[#F26F21]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">New Menu Price (Rs.)</label>
              <input
                type="number"
                required
                placeholder="1000"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="min-h-[44px] w-full bg-[#0A0B0F] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white font-mono outline-none focus:border-[#F26F21]"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-[44px] w-full bg-[#0A0B0F] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white outline-none"
              >
                {categories
                  .filter((c) => c !== "All Categories")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Portion</label>
              <input
                type="text"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                className="min-h-[44px] w-full bg-[#0A0B0F] border border-white/[0.08] rounded-xl px-3.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#0A0B0F] border border-white/[0.06] cursor-pointer">
            <input
              type="checkbox"
              checked={unifyHistoricalOrders}
              onChange={(e) => setUnifyHistoricalOrders(e.target.checked)}
              className="mt-0.5 accent-[#F26F21]"
            />
            <div>
              <p className="text-white font-medium">
                Also unify historical order item names in tce_orders
              </p>
              <p className="text-zinc-500 mt-0.5">
                Combines past Dish Sales Counter totals under the new name without altering order subtotals, totals, or ledger journals.
              </p>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || selected.length < 2}
            className="min-h-[44px] px-5 rounded-xl bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
          >
            {busy ? "Merging..." : "Confirm Merge"}
          </button>
        </div>
      </form>
    </div>
  );
}
