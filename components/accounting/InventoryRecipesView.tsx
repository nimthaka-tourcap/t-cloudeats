"use client";

import React, { useState } from "react";
import { formatLKR2 } from "@/lib/accounting/format";
import { Plus, X } from "lucide-react";

interface InventoryRecipesViewProps {
  data: { inventory: any[]; recipes: any[]; movements: any[] } | null;
  onRefresh: () => void;
}

export default function InventoryRecipesView({ data, onRefresh }: InventoryRecipesViewProps) {
  const [subTab, setSubTab] = useState<"STOCK" | "RECIPES" | "MOVEMENTS">("STOCK");
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
  const [dishName, setDishName] = useState("");
  const [portion, setPortion] = useState("Full Portion");
  const [packagingCost, setPackagingCost] = useState("33");
  const [ingredients, setIngredients] = useState<
    { inventory_id: string; ingredient_name: string; recipe_qty: string; recipe_unit: string }[]
  >([{ inventory_id: "", ingredient_name: "", recipe_qty: "100", recipe_unit: "g" }]);

  if (!data) return <div className="p-8 text-center text-xs text-slate-600">Loading Inventory &amp; Recipes...</div>;

  async function handleStockOp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedInvId || !qty) {
      setError("Select an inventory item and quantity.");
      return;
    }
    setBusy(true);
    try {
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
      onRefresh();
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
      setDishName("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200">
          {[
            { id: "STOCK", label: `Inventory (${data.inventory.length})` },
            { id: "RECIPES", label: `Recipes (${data.recipes.length})` },
            { id: "MOVEMENTS", label: "Movements" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                subTab === t.id ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setError("");
              setOpMode("PURCHASE");
              setSelectedInvId(data.inventory[0]?.id || "");
              setUnit(data.inventory[0]?.unit || "kg");
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer"
          >
            + Purchase
          </button>
          <button
            onClick={() => {
              setError("");
              setOpMode("STOCK_TAKE");
              setSelectedInvId(data.inventory[0]?.id || "");
              setUnit(data.inventory[0]?.unit || "kg");
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium cursor-pointer"
          >
            Stock-Take
          </button>
          <button
            onClick={() => {
              setError("");
              setOpMode("WASTE");
              setSelectedInvId(data.inventory[0]?.id || "");
              setUnit(data.inventory[0]?.unit || "kg");
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium cursor-pointer"
          >
            Log Waste
          </button>
        </div>
      </div>

      {/* Stock Table */}
      {subTab === "STOCK" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-600 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 font-medium">SKU</th>
                <th className="px-4 py-2.5 font-medium">Ingredient</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium text-right">On Hand</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium text-right">Unit Cost</th>
                <th className="px-4 py-2.5 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-600">{item.sku}</td>
                  <td className="px-4 py-2.5 text-slate-900 font-medium">{item.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{item.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-700 font-medium">{Number(item.quantity).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{item.unit}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700">{formatLKR2(item.unit_cost)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 font-medium">{formatLKR2(Number(item.quantity) * Number(item.unit_cost))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipes */}
      {subTab === "RECIPES" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRecipeDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Map Recipe
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recipes.length === 0 ? (
              <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-600">
                No recipes mapped yet.
              </div>
            ) : (
              data.recipes.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{r.dish_name}</p>
                      <span className="text-[11px] text-slate-600">{r.portion}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono tabular-nums font-semibold text-emerald-700">{formatLKR2(r.computed_total_cost)}</p>
                      <p className="text-[10px] text-slate-600">Food {formatLKR2(r.computed_food_cost)} + Pkg {formatLKR2(r.packaging_cost)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(r.ingredients || []).map((ing: any) => (
                      <div key={ing.id} className="flex justify-between text-slate-600">
                        <span>{ing.ingredient_name} ({ing.recipe_qty} {ing.recipe_unit})</span>
                        <span className="font-mono tabular-nums text-slate-900 font-medium">{formatLKR2(ing.computed_cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Movements */}
      {subTab === "MOVEMENTS" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-600 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Inventory</th>
                <th className="px-4 py-2.5 font-medium text-right">Delta</th>
                <th className="px-4 py-2.5 font-medium text-right">Cost</th>
                <th className="px-4 py-2.5 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-600">{String(m.created_at).slice(0, 10)}</td>
                  <td className="px-4 py-2.5 text-slate-900 font-medium">{m.movement_type}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{m.inventory_id}</td>
                  <td className={`px-4 py-2.5 text-right font-mono tabular-nums font-medium ${Number(m.quantity_delta) < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {Number(m.quantity_delta) > 0 ? "+" : ""}{Number(m.quantity_delta).toFixed(3)} {m.unit}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 font-medium">{formatLKR2(m.total_cost)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-Over Drawer: Purchase / Stock-Take / Waste */}
      {opMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <form onSubmit={handleStockOp} className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  {opMode === "PURCHASE" ? "Record Purchase" : opMode === "STOCK_TAKE" ? "Weekly Stock-Take" : "Log Waste"}
                </h4>
                <button type="button" onClick={() => setOpMode(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {error && <p className="text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">{error}</p>}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Item</label>
                <select
                  value={selectedInvId}
                  onChange={(e) => {
                    setSelectedInvId(e.target.value);
                    const found = data.inventory.find((x) => x.id === e.target.value);
                    if (found) setUnit(found.unit);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500"
                >
                  {data.inventory.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{opMode === "STOCK_TAKE" ? "Physical Count" : "Quantity"}</label>
                  <input type="number" step="0.001" required value={qty} onChange={(e) => setQty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500">
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
                    <label className="block text-slate-700 font-medium mb-1">Total Cost (LKR)</label>
                    <input type="number" step="0.01" required value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Supplier</label>
                    <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500" />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Payment Account</label>
                    <select value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500">
                      <option value="1120">1120 — Bank Operating</option>
                      <option value="1110">1110 — Cash in Hand</option>
                      <option value="2110">2110 — Accounts Payable</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Reason</label>
                  <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Audit note..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-500" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setOpMode(null)} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer">
                {busy ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slide-Over Drawer: Recipe Builder */}
      {showRecipeDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <form onSubmit={handleSaveRecipe} className="w-full max-w-lg bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-semibold text-slate-900">Map Dish Recipe</h4>
                <button type="button" onClick={() => setShowRecipeDrawer(false)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Menu Dish Title</label>
                  <input type="text" required value={dishName} onChange={(e) => setDishName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Packaging (LKR)</label>
                  <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Portion</label>
                <input type="text" value={portion} onChange={(e) => setPortion(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="block text-slate-700 font-medium">Ingredients</label>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <select
                      value={ing.inventory_id}
                      onChange={(e) => {
                        const inv = data.inventory.find((x) => x.id === e.target.value);
                        const next = [...ingredients];
                        next[idx].inventory_id = e.target.value;
                        if (inv) next[idx].ingredient_name = inv.name;
                        setIngredients(next);
                      }}
                      className="col-span-6 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500"
                    >
                      <option value="">Select stock...</option>
                      {data.inventory.map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
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
                      className="col-span-3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-sky-500"
                    />
                    <select
                      value={ing.recipe_unit}
                      onChange={(e) => {
                        const next = [...ingredients];
                        next[idx].recipe_unit = e.target.value;
                        setIngredients(next);
                      }}
                      className="col-span-3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-900 outline-none focus:bg-white focus:border-sky-500"
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
                  onClick={() => setIngredients([...ingredients, { inventory_id: "", ingredient_name: "", recipe_qty: "10", recipe_unit: "g" }])}
                  className="text-sky-600 hover:text-sky-700 hover:underline font-medium cursor-pointer"
                >
                  + Add Ingredient
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setShowRecipeDrawer(false)} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer">Save Recipe</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
