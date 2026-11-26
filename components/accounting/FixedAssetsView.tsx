"use client";

import React, { useState } from "react";
import { formatLKR2, todayISO } from "@/lib/accounting/format";
import { Plus, Play, X, Pencil } from "lucide-react";

interface FixedAssetsViewProps {
  assets: any[];
  capexThreshold: number;
  onRefresh: () => void;
}

export default function FixedAssetsView({ assets, capexThreshold, onRefresh }: FixedAssetsViewProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("KITCHEN_EQUIPMENT");
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [cost, setCost] = useState("");
  const [residual, setResidual] = useState("0");
  const [lifeMonths, setLifeMonths] = useState("60");
  const [fundingAccount, setFundingAccount] = useState("1120");
  const [supplier, setSupplier] = useState("");
  const [depMonth, setDepMonth] = useState(todayISO().slice(0, 7));
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/fixed-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          asset_category: category,
          purchase_date: purchaseDate,
          cost: Number(cost),
          residual_value: Number(residual || 0),
          useful_life_months: Number(lifeMonths),
          funding_account: fundingAccount,
          supplier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to capitalize asset");
      setShowDrawer(false);
      setName("");
      setCost("");
      setMsg(`Capitalized ${data.asset.id} (${data.journalEntryId})`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRunDepreciation() {
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/fixed-assets/depreciate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: depMonth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Depreciation run failed");
      setMsg(
        data.journalEntryId
          ? `Depreciated ${data.assetsDepreciated} assets (${formatLKR2(data.totalDepPosted)})`
          : data.message
      );
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveAssetEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAsset) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/fixed-assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAsset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setEditingAsset(null);
      setMsg(`Updated asset ${data.id}`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const totalCost = assets.reduce((s, a) => s + Number(a.cost || 0), 0);
  const totalNbv = assets.reduce((s, a) => s + Number(a.net_book_value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Threshold: <span className="font-mono text-slate-800">{formatLKR2(capexThreshold)}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={depMonth}
            onChange={(e) => setDepMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
          />
          <button
            onClick={handleRunDepreciation}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium cursor-pointer"
          >
            <Play className="w-3 h-3" /> Depreciate
          </button>
          <button
            onClick={() => { setError(""); setShowDrawer(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Capitalize Asset
          </button>
        </div>
      </div>

      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-4 py-2.5 rounded-lg text-xs">{msg}</div>}
      {error && !showDrawer && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 px-4 py-2.5 rounded-lg text-xs">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">Asset</th>
              <th className="px-4 py-2.5 font-medium">Acct</th>
              <th className="px-4 py-2.5 font-medium">Purchased</th>
              <th className="px-4 py-2.5 font-medium text-right">Cost</th>
              <th className="px-4 py-2.5 font-medium text-right">Monthly Dep</th>
              <th className="px-4 py-2.5 font-medium text-right">Accum. Dep</th>
              <th className="px-4 py-2.5 font-medium text-right">NBV</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">No fixed assets capitalized yet.</td>
              </tr>
            ) : (
              assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{a.id}</td>
                  <td className="px-4 py-2.5 text-slate-900 font-medium">{a.name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{a.account_code}</td>
                  <td className="px-4 py-2.5 text-slate-500">{String(a.purchase_date).slice(0, 10)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800">{formatLKR2(a.cost)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-500">{formatLKR2(a.monthly_depreciation)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-500">{formatLKR2(a.accumulated_depreciation)}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-emerald-600">{formatLKR2(a.net_book_value)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingAsset({ ...a })}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {assets.length > 0 && (
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td colSpan={4} className="px-4 py-3">Total PP&amp;E</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{formatLKR2(totalCost)}</td>
                <td colSpan={2}></td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-600">{formatLKR2(totalNbv)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <form onSubmit={handleAddAsset} className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-semibold text-slate-900">Capitalize Fixed Asset</h4>
                <button type="button" onClick={() => setShowDrawer(false)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {error && <p className="text-rose-600 bg-rose-500/10 p-2.5 rounded-lg">{error}</p>}
              <div>
                <label className="block text-slate-500 mb-1">Asset Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none">
                  <option value="KITCHEN_EQUIPMENT">1510 — Kitchen Equipment &amp; Refrigeration</option>
                  <option value="GAS_INFRASTRUCTURE">1520 — Cooking &amp; Gas Infrastructure</option>
                  <option value="POS_IT_HARDWARE">1530 — POS &amp; IT Hardware</option>
                  <option value="FURNITURE_FIXTURES">1540 — Furniture &amp; Fixtures</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Purchase Date</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Cost (LKR)</label>
                  <input type="number" step="0.01" required value={cost} onChange={(e) => setCost(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Useful Life (Months)</label>
                  <input type="number" required value={lifeMonths} onChange={(e) => setLifeMonths(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Residual (LKR)</label>
                  <input type="number" value={residual} onChange={(e) => setResidual(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Funding Account</label>
                <select value={fundingAccount} onChange={(e) => setFundingAccount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none">
                  <option value="1120">1120 — Bank Account</option>
                  <option value="1110">1110 — Cash in Hand</option>
                  <option value="2210">2210 — Director Loan</option>
                  <option value="2110">2110 — Accounts Payable</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Supplier</label>
                <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setShowDrawer(false)} className="px-4 py-2 text-xs text-slate-500 cursor-pointer">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-xs font-medium cursor-pointer">Capitalize</button>
            </div>
          </form>
        </div>
      )}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <form onSubmit={handleSaveAssetEdit} className="w-full max-w-md bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-semibold text-slate-900">Edit Asset {editingAsset.id}</h4>
                <button type="button" onClick={() => setEditingAsset(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Asset Name</label>
                <input type="text" required value={editingAsset.name} onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Cost (LKR)</label>
                  <input type="number" step="0.01" required value={editingAsset.cost} onChange={(e) => setEditingAsset({ ...editingAsset, cost: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Useful Life (Months)</label>
                  <input type="number" required value={editingAsset.useful_life_months} onChange={(e) => setEditingAsset({ ...editingAsset, useful_life_months: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Supplier</label>
                <input type="text" value={editingAsset.supplier || ""} onChange={(e) => setEditingAsset({ ...editingAsset, supplier: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Status</label>
                <select value={editingAsset.status} onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISPOSED">DISPOSED</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setEditingAsset(null)} className="px-4 py-2 text-xs text-slate-500 cursor-pointer">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-xs font-medium cursor-pointer">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
