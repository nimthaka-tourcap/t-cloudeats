"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Copy, RefreshCw, X, Merge } from "lucide-react";
import { CashierMenuItem } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";
import MergeDishesModal from "./MergeDishesModal";

interface MenuManagerViewProps {
  menuItems: CashierMenuItem[];
  categories: string[];
  isAddingItem: boolean;
  setIsAddingItem: (v: boolean) => void;
  newItemData: Omit<CashierMenuItem, "id">;
  setNewItemData: React.Dispatch<React.SetStateAction<Omit<CashierMenuItem, "id">>>;
  editingItem: CashierMenuItem | null;
  setEditingItem: React.Dispatch<React.SetStateAction<CashierMenuItem | null>>;
  onAddItem: (e: React.FormEvent) => void;
  onEditItem: (e: React.FormEvent) => void;
  onDeleteItem: (id: number) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => void;
  onToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function MenuManagerView({
  menuItems,
  categories,
  isAddingItem,
  setIsAddingItem,
  newItemData,
  setNewItemData,
  editingItem,
  setEditingItem,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onImageChange,
  onToast,
}: MenuManagerViewProps) {
  const [search, setSearch] = useState("");
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const filtered = search.trim()
    ? menuItems.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.category.toLowerCase().includes(search.toLowerCase()) ||
          (m.sku && m.sku.toLowerCase().includes(search.toLowerCase()))
      )
    : menuItems;

  const handleDuplicate = (item: CashierMenuItem) => {
    setNewItemData({
      title: `${item.title} (Copy)`,
      price: item.price,
      category: item.category,
      portion: item.portion,
      sku: item.sku ? `${item.sku}-COPY` : "",
      image: item.image,
      description: item.description,
    });
    setIsAddingItem(true);
    setEditingItem(null);
  };

  const handleGoogleImport = async () => {
    setSyncingGoogle(true);
    try {
      const res = await fetch("/api/google/sync-menu");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google sync failed");
      onToast(data.message || "Google menu synced!", "success");
    } catch (err: any) {
      onToast(err.message || "Google sync failed", "error");
    } finally {
      setSyncingGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Menu Database ({menuItems.length})
          </h3>
          <input
            type="text"
            placeholder="Filter menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none focus:border-[#F26F21]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMergeModal(true)}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Merge size={14} /> Merge Dishes
          </button>
          <button
            type="button"
            onClick={handleGoogleImport}
            disabled={syncingGoogle}
            className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncingGoogle ? "animate-spin" : ""} />
            <span>Sync Google</span>
          </button>
          {!isAddingItem && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddingItem(true);
              }}
              className="min-h-[44px] px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> New Menu Item
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {isAddingItem && (
        <form
          onSubmit={onAddItem}
          className="bg-white border border-[#F26F21]/40 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-semibold text-slate-900">Add Menu Item</h4>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="SKU (e.g. FR-01)"
              value={newItemData.sku || ""}
              onChange={(e) => setNewItemData((prev) => ({ ...prev, sku: e.target.value }))}
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none focus:border-[#F26F21]"
              required
            />
            <input
              type="text"
              placeholder="Dish Title"
              value={newItemData.title}
              onChange={(e) => setNewItemData((prev) => ({ ...prev, title: e.target.value }))}
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none focus:border-[#F26F21]"
              required
            />
            <input
              type="number"
              placeholder="Price (LKR)"
              value={newItemData.price || ""}
              onChange={(e) =>
                setNewItemData((prev) => ({ ...prev, price: Number(e.target.value) }))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 font-mono outline-none focus:border-[#F26F21]"
              required
            />
            <select
              value={newItemData.category}
              onChange={(e) =>
                setNewItemData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
            >
              {categories
                .filter((c) => c !== "All Categories")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
            <select
              value={newItemData.portion || "Large Portion"}
              onChange={(e) =>
                setNewItemData((prev) => ({ ...prev, portion: e.target.value }))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
            >
              <option value="Large Portion">Large Portion</option>
              <option value="Regular Portion">Regular Portion</option>
              <option value="Medium Portion">Medium Portion</option>
              <option value="Extra Large Portion">Extra Large Portion</option>
              <option value="1000 ml">1000 ml</option>
              <option value="1050 ml">1050 ml</option>
            </select>
            <div className="relative min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-500 flex items-center justify-between">
              <span className="truncate">
                {newItemData.image ? "Photo Loaded" : "Upload Photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageChange(e, false)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="min-h-[44px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-sky-500 text-white text-xs font-semibold cursor-pointer"
            >
              Save Item
            </button>
          </div>
        </form>
      )}

      {/* Edit Form */}
      {editingItem && (
        <form
          onSubmit={onEditItem}
          className="bg-white border border-sky-500/40 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-semibold text-slate-900">Edit Menu Item</h4>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="SKU"
              value={editingItem.sku || ""}
              onChange={(e) =>
                setEditingItem((prev) => (prev ? { ...prev, sku: e.target.value } : null))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Title"
              value={editingItem.title}
              onChange={(e) =>
                setEditingItem((prev) => (prev ? { ...prev, title: e.target.value } : null))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
              required
            />
            <input
              type="number"
              placeholder="Price (LKR)"
              value={editingItem.price || ""}
              onChange={(e) =>
                setEditingItem((prev) =>
                  prev ? { ...prev, price: Number(e.target.value) } : null
                )
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 font-mono outline-none"
              required
            />
            <select
              value={editingItem.category}
              onChange={(e) =>
                setEditingItem((prev) => (prev ? { ...prev, category: e.target.value } : null))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
            >
              {categories
                .filter((c) => c !== "All Categories")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
            <select
              value={editingItem.portion || "Large Portion"}
              onChange={(e) =>
                setEditingItem((prev) => (prev ? { ...prev, portion: e.target.value } : null))
              }
              className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
            >
              <option value="Large Portion">Large Portion</option>
              <option value="Regular Portion">Regular Portion</option>
              <option value="Medium Portion">Medium Portion</option>
              <option value="Extra Large Portion">Extra Large Portion</option>
              <option value="1000 ml">1000 ml</option>
              <option value="1050 ml">1050 ml</option>
            </select>
            <div className="relative min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-500 flex items-center justify-between">
              <span className="truncate">
                {editingItem.image ? "Photo Loaded" : "Change Photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageChange(e, true)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="min-h-[44px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-sky-500 text-white text-xs font-semibold cursor-pointer"
            >
              Update Item
            </button>
          </div>
        </form>
      )}

      {/* Menu Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Dish Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Portion</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-500">{item.sku || "—"}</td>
                <td className="px-4 py-3 text-slate-900 font-medium">{item.title}</td>
                <td className="px-4 py-3 text-slate-500">{item.category}</td>
                <td className="px-4 py-3 text-slate-500">{item.portion}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                  {formatLKR2(item.price)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      className="min-h-[36px] px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer"
                      title="Duplicate Item"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingItem(false);
                        setEditingItem(item);
                      }}
                      className="min-h-[36px] px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer"
                      title="Edit Item"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${item.title}" from menu?`)) {
                          onDeleteItem(item.id);
                        }
                      }}
                      className="min-h-[36px] px-2.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-slate-900 cursor-pointer transition"
                      title="Delete Item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MergeDishesModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        availableDishTitles={menuItems.map((m) => ({
          title: m.title,
          category: m.category,
          price: m.price,
        }))}
        categories={categories}
        onMerged={(msg) => onToast(msg, "success")}
      />
    </div>
  );
}
