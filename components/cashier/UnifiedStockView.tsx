"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, X, Package, UtensilsCrossed, ClipboardCheck, ShoppingCart, Pencil, Trash2 } from "lucide-react";
import { formatLKR2 } from "@/lib/utils/currency";
import FoodCostingModule from "@/components/cashier/FoodCostingModule";

interface UnifiedStockViewProps {
  onAddNewInventoryItem: () => void;
  onEditInventoryItem?: (item: any) => void;
}

export default function UnifiedStockView({
  onAddNewInventoryItem,
}: UnifiedStockViewProps) {
  const [tab, setTab] = useState<"STOCK" | "RECIPES" | "WASTE" | "MARKET">("STOCK");
  const [stockCategoryFilter, setStockCategoryFilter] = useState<"ALL" | "FOOD" | "SMALLWARES" | "CLEANING">("ALL");
  const [data, setData] = useState<{
    inventory: any[];
    recipes: any[];
    movements: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [opMode, setOpMode] = useState<"PURCHASE" | "WASTE" | "STOCK_TAKE" | null>(null);
  const [selectedInvId, setSelectedInvId] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [totalCost, setTotalCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [reason, setReason] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("1120");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showRecipeDrawer, setShowRecipeDrawer] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingIng, setEditingIng] = useState<any | null>(null);
  const [dishName, setDishName] = useState("");
  const [portion, setPortion] = useState("Full Portion");
  const [packagingCost, setPackagingCost] = useState("33");
  const [ingredients, setIngredients] = useState<
    { inventory_id: string; ingredient_name: string; recipe_qty: string; recipe_unit: string }[]
  >([{ inventory_id: "", ingredient_name: "", recipe_qty: "100", recipe_unit: "g" }]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/inventory-ops");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load unified stock data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStockOp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedInvId || !qty) {
      setError("Select an inventory item and quantity.");
      return;
    }
    setBusy(true);
    try {
      const selectedItem = invList.find((x) => x.id === selectedInvId);
      const autoAccount =
        selectedItem?.category === "Kitchen Smallwares"
          ? "6400"
          : selectedItem?.category === "Cleaning & Hygiene"
          ? "6500"
          : selectedItem?.category === "Packaging"
          ? "1150"
          : "1140";

      const payload: any = {
        action: opMode,
        inventoryId: selectedInvId,
        unit,
        reason,
      };
      if (opMode === "PURCHASE") {
        payload.purchaseQty = Number(qty);
        payload.purchaseUnit = unit;
        payload.totalCost = Number(totalCost);
        payload.supplier = supplier;
        payload.paymentAccount = paymentAccount;
        payload.inventoryAccount = autoAccount;
      } else {
        payload.qty = Number(qty);
      }

      const res = await fetch("/api/accounting/inventory-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");
      setOpMode(null);
      setQty("");
      setTotalCost("");
      setReason("");
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRecipe(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dishName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/inventory-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_RECIPE",
          id: editingRecipeId || undefined,
          dish_name: dishName,
          portion,
          packaging_cost: Number(packagingCost || 0),
          ingredients: ingredients.map((i) => ({
            inventory_id: i.inventory_id || null,
            ingredient_name: i.ingredient_name,
            recipe_qty: Number(i.recipe_qty),
            recipe_unit: i.recipe_unit,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save recipe");
      setShowRecipeDrawer(false);
      setEditingRecipeId(null);
      setDishName("");
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveIngredientEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingIng) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/inventory-ops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingIng),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update ingredient");
      setEditingIng(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteIngredient(id: string, name: string) {
    if (!window.confirm(`Delete ingredient "${name}" from inventory?`)) return;
    try {
      const res = await fetch(`/api/accounting/inventory-ops?inventoryId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteRecipe(id: string, name: string) {
    if (!window.confirm(`Delete recipe "${name}"?`)) return;
    try {
      const res = await fetch(`/api/accounting/inventory-ops?recipeId=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  const invList = data?.inventory || [];
  const foodInvList = invList.filter(
    (i) => i.category !== "Kitchen Smallwares" && i.category !== "Cleaning & Hygiene"
  );
  const filteredStockList = invList.filter((i) => {
    if (stockCategoryFilter === "SMALLWARES") return i.category === "Kitchen Smallwares";
    if (stockCategoryFilter === "CLEANING") return i.category === "Cleaning & Hygiene";
    if (stockCategoryFilter === "FOOD")
      return i.category !== "Kitchen Smallwares" && i.category !== "Cleaning & Hygiene";
    return true;
  });
  const recipeList = data?.recipes || [];
  const movementList = data?.movements || [];

  return (
    <div className="space-y-6">
      {/* Unified Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#111318] border border-[#1F2430] gap-1">
          {[
            { id: "STOCK", label: `Live Stock & GRN (${invList.length})`, icon: <Package size={14} /> },
            { id: "RECIPES", label: `Recipes & Costing (${recipeList.length})`, icon: <UtensilsCrossed size={14} /> },
            { id: "WASTE", label: "Wastage & Stock-Take", icon: <ClipboardCheck size={14} /> },
            { id: "MARKET", label: "Market Order List", icon: <ShoppingCart size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                tab === t.id ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setError("");
              setOpMode("PURCHASE");
              setSelectedInvId(invList[0]?.id || "");
              setUnit(invList[0]?.unit || "kg");
            }}
            className="min-h-[44px] px-4 rounded-xl bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-semibold cursor-pointer"
          >
            + Purchase GRN
          </button>
          <button
            type="button"
            onClick={onAddNewInventoryItem}
            className="min-h-[44px] px-4 rounded-xl bg-[#111318] border border-[#1F2430] hover:bg-white/[0.05] text-zinc-200 text-xs font-medium cursor-pointer"
          >
            + New Ingredient
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE STOCK & GRN */}
      {tab === "STOCK" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "All Items" },
              { id: "FOOD", label: "Food & Ingredients" },
              { id: "SMALLWARES", label: "Kitchen Smallwares (6400)" },
              { id: "CLEANING", label: "Cleaning & Hygiene (6500)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStockCategoryFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  stockCategoryFilter === f.id
                    ? "bg-[#1C1F26] text-white border border-white/10"
                    : "bg-[#111318] text-zinc-400 hover:text-white border border-[#1F2430]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="bg-[#111318] border border-[#1F2430] rounded-xl overflow-x-auto">
          {loading && invList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading inventory...</div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="text-zinc-400 border-b border-[#1F2430] bg-[#0A0B0F]">
                <tr>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Ingredient</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium text-right">On Hand</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Stock Value</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430]">
                {filteredStockList.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-zinc-500">{item.sku}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.category}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.storage_location}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400">
                      {Number(item.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-300">
                      {formatLKR2(item.unit_cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                      {formatLKR2(Number(item.quantity) * Number(item.unit_cost))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setEditingIng({ ...item });
                          }}
                          className="min-h-[36px] px-2.5 rounded-lg bg-[#0A0B0F] border border-[#1F2430] text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
                          title="Edit Ingredient"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(item.id, item.name)}
                          className="min-h-[36px] px-2.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white cursor-pointer transition"
                          title="Delete Ingredient"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES & BOM COSTING */}
      {tab === "RECIPES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Database-Linked Recipes (Auto-COGS on POS Sync)
            </h3>
            <button
              type="button"
              onClick={() => setShowRecipeDrawer(true)}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#F26F21] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Map Recipe
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipeList.map((r) => (
              <div
                key={r.id}
                className="bg-[#111318] border border-[#1F2430] rounded-xl p-4 text-xs space-y-2.5"
              >
                <div className="flex justify-between items-center border-b border-[#1F2430] pb-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{r.dish_name}</p>
                    <span className="text-zinc-500">{r.portion}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono tabular-nums font-semibold text-emerald-400">
                        {formatLKR2(r.computed_total_cost)}
                      </p>
                      <p className="text-zinc-500">
                        Food {formatLKR2(r.computed_food_cost)} + Pkg {formatLKR2(r.packaging_cost)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecipeId(r.id);
                        setDishName(r.dish_name);
                        setPortion(r.portion || "Full Portion");
                        setPackagingCost(String(r.packaging_cost || 0));
                        setIngredients(
                          (r.ingredients || []).length > 0
                            ? r.ingredients.map((i: any) => ({
                                inventory_id: i.inventory_id || "",
                                ingredient_name: i.ingredient_name,
                                recipe_qty: String(i.recipe_qty),
                                recipe_unit: i.recipe_unit,
                              }))
                            : [{ inventory_id: "", ingredient_name: "", recipe_qty: "100", recipe_unit: "g" }]
                        );
                        setShowRecipeDrawer(true);
                      }}
                      className="p-2 rounded-lg bg-[#0A0B0F] border border-[#1F2430] text-zinc-300 hover:text-white cursor-pointer"
                      title="Edit Recipe"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecipe(r.id, r.dish_name)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white cursor-pointer transition"
                      title="Delete Recipe"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {(r.ingredients || []).map((ing: any) => (
                    <div key={ing.id} className="flex justify-between text-zinc-400">
                      <span>
                        {ing.ingredient_name} ({ing.recipe_qty} {ing.recipe_unit})
                      </span>
                      <span className="font-mono tabular-nums text-zinc-200">
                        {formatLKR2(ing.computed_cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Embedded Food Cost Matrix & Simulator */}
          <div className="pt-4 border-t border-[#1F2430]">
            <FoodCostingModule onAddStockClick={onAddNewInventoryItem} />
          </div>
        </div>
      )}

      {/* TAB 3: WASTAGE & STOCK-TAKE */}
      {tab === "WASTE" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setError("");
                setOpMode("STOCK_TAKE");
                setSelectedInvId(invList[0]?.id || "");
                setUnit(invList[0]?.unit || "kg");
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#111318] border border-[#1F2430] hover:bg-white/[0.05] text-white text-xs font-medium cursor-pointer"
            >
              + Weekly Stock-Take
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setOpMode("WASTE");
                setSelectedInvId(invList[0]?.id || "");
                setUnit(invList[0]?.unit || "kg");
              }}
              className="min-h-[44px] px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-xs font-medium cursor-pointer"
            >
              + Log Kitchen Waste
            </button>
          </div>

          <div className="bg-[#111318] border border-[#1F2430] rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-zinc-400 border-b border-[#1F2430] bg-[#0A0B0F]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Inventory</th>
                  <th className="px-4 py-3 font-medium text-right">Delta</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430]">
                {movementList.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-zinc-400">{String(m.created_at).slice(0, 10)}</td>
                    <td className="px-4 py-3 text-zinc-200">{m.movement_type}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{m.inventory_id}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums ${
                        Number(m.quantity_delta) < 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {Number(m.quantity_delta) > 0 ? "+" : ""}
                      {Number(m.quantity_delta).toFixed(3)} {m.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                      {formatLKR2(m.total_cost)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MARKET ORDER LIST */}
      {tab === "MARKET" && <FoodCostingModule onAddStockClick={onAddNewInventoryItem} />}

      {/* Slide-Over Drawer: Purchase / Stock-Take / Waste */}
      {opMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <form
            onSubmit={handleStockOp}
            className="w-full max-w-md bg-[#111318] border-l border-[#1F2430] h-full p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
                <h4 className="text-sm font-semibold text-white">
                  {opMode === "PURCHASE"
                    ? "Record Purchase (GRN)"
                    : opMode === "STOCK_TAKE"
                    ? "Weekly Physical Stock-Take"
                    : "Log Kitchen Waste"}
                </h4>
                <button
                  type="button"
                  onClick={() => setOpMode(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              {error && (
                <p className="text-rose-400 bg-rose-500/10 p-3 rounded-lg">{error}</p>
              )}
              <div>
                <label className="block text-zinc-400 mb-1">Ingredient</label>
                <select
                  value={selectedInvId}
                  onChange={(e) => {
                    setSelectedInvId(e.target.value);
                    const found = invList.find((x) => x.id === e.target.value);
                    if (found) setUnit(found.unit);
                  }}
                  className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                >
                  {invList.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">
                    {opMode === "STOCK_TAKE" ? "Physical Count" : "Quantity"}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lbs">lbs</option>
                    <option value="liters">liters</option>
                    <option value="ml">ml</option>
                    <option value="units">units</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>
              {opMode === "PURCHASE" ? (
                <>
                  <div>
                    <label className="block text-zinc-400 mb-1">Total Cost (LKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={totalCost}
                      onChange={(e) => setTotalCost(e.target.value)}
                      className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Payment Account</label>
                    <select
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                      className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                    >
                      <option value="1120">1120 — Bank Operating</option>
                      <option value="1110">1110 — Cash in Hand</option>
                      <option value="2110">2110 — Accounts Payable</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-zinc-400 mb-1">Reason</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Audit note..."
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#1F2430]">
              <button
                type="button"
                onClick={() => setOpMode(null)}
                className="min-h-[44px] px-4 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] px-5 rounded-xl bg-[#F26F21] text-white text-xs font-semibold cursor-pointer"
              >
                {busy ? "Posting..." : "Post & Update Ledger"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slide-Over Drawer: Map Recipe */}
      {showRecipeDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <form
            onSubmit={handleSaveRecipe}
            className="w-full max-w-lg bg-[#111318] border-l border-[#1F2430] h-full p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
                <h4 className="text-sm font-semibold text-white">Map Dish Recipe</h4>
                <button
                  type="button"
                  onClick={() => setShowRecipeDrawer(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-400 mb-1">Menu Dish Title</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Packaging (LKR)</label>
                  <input
                    type="number"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Portion</label>
                <input
                  type="text"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-zinc-400">Ingredients</label>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <select
                      value={ing.inventory_id}
                      onChange={(e) => {
                        const inv = invList.find((x) => x.id === e.target.value);
                        const next = [...ingredients];
                        next[idx].inventory_id = e.target.value;
                        if (inv) next[idx].ingredient_name = inv.name;
                        setIngredients(next);
                      }}
                      className="col-span-6 min-h-[40px] bg-[#0A0B0F] border border-[#1F2430] rounded-lg px-2 text-white outline-none"
                    >
                      <option value="">Select food stock...</option>
                      {foodInvList.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={ing.recipe_qty}
                      onChange={(e) => {
                        const next = [...ingredients];
                        next[idx].recipe_qty = e.target.value;
                        setIngredients(next);
                      }}
                      className="col-span-3 min-h-[40px] bg-[#0A0B0F] border border-[#1F2430] rounded-lg px-2 text-white font-mono outline-none"
                    />
                    <select
                      value={ing.recipe_unit}
                      onChange={(e) => {
                        const next = [...ingredients];
                        next[idx].recipe_unit = e.target.value;
                        setIngredients(next);
                      }}
                      className="col-span-3 min-h-[40px] bg-[#0A0B0F] border border-[#1F2430] rounded-lg px-2 text-white outline-none"
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="tsp">tsp</option>
                      <option value="tbsp">tbsp</option>
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="l">l</option>
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setIngredients([
                      ...ingredients,
                      { inventory_id: "", ingredient_name: "", recipe_qty: "10", recipe_unit: "g" },
                    ])
                  }
                  className="text-[#F26F21] hover:underline cursor-pointer"
                >
                  + Add Ingredient
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#1F2430]">
              <button
                type="button"
                onClick={() => setShowRecipeDrawer(false)}
                className="min-h-[44px] px-4 rounded-xl text-xs text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] px-5 rounded-xl bg-[#F26F21] text-white text-xs font-semibold cursor-pointer"
              >
                Save Recipe
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Slide-Over Drawer: Edit Ingredient */}
      {editingIng && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <form
            onSubmit={handleSaveIngredientEdit}
            className="w-full max-w-md bg-[#111318] border-l border-[#1F2430] h-full p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
                <h4 className="text-sm font-semibold text-white">Edit Ingredient</h4>
                <button
                  type="button"
                  onClick={() => setEditingIng(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              {error && <p className="text-rose-400 bg-rose-500/10 p-3 rounded-lg">{error}</p>}
              <div>
                <label className="block text-zinc-400 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={editingIng.name || ""}
                  onChange={(e) => setEditingIng({ ...editingIng, name: e.target.value })}
                  className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingIng.sku || ""}
                    onChange={(e) => setEditingIng({ ...editingIng, sku: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingIng.category || ""}
                    onChange={(e) => setEditingIng({ ...editingIng, category: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Base Unit</label>
                  <select
                    value={editingIng.unit || "kg"}
                    onChange={(e) => setEditingIng({ ...editingIng, unit: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-2 text-sm text-white outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="liters">liters</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="pack">pack</option>
                    <option value="units">units</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Qty</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingIng.quantity ?? 0}
                    onChange={(e) => setEditingIng({ ...editingIng, quantity: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Par Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingIng.par_level ?? 0}
                    onChange={(e) => setEditingIng({ ...editingIng, par_level: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Unit Cost (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingIng.unit_cost ?? 0}
                    onChange={(e) => setEditingIng({ ...editingIng, unit_cost: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Storage Location</label>
                  <select
                    value={editingIng.storage_location || "Dry Shelf"}
                    onChange={(e) => setEditingIng({ ...editingIng, storage_location: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-2 text-sm text-white outline-none"
                  >
                    <option value="Cooler">Cooler</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Dry Shelf">Dry Shelf</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={editingIng.supplier || ""}
                    onChange={(e) => setEditingIng({ ...editingIng, supplier: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={editingIng.expiration_date ? String(editingIng.expiration_date).slice(0, 10) : ""}
                    onChange={(e) => setEditingIng({ ...editingIng, expiration_date: e.target.value })}
                    className="min-h-[44px] w-full bg-[#0A0B0F] border border-[#1F2430] rounded-xl px-3 text-sm text-white outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#1F2430]">
              <button
                type="button"
                onClick={() => setEditingIng(null)}
                className="min-h-[44px] px-4 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] px-5 rounded-xl bg-[#F26F21] text-white text-xs font-semibold cursor-pointer"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
