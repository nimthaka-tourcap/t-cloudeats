"use client";

import React, { useState, useEffect } from "react";
import { formatLKR2 } from "@/lib/accounting/format";

interface SettingsCoAViewProps {
  settings: any;
  coa: any[];
  onRefresh: () => void;
}

export default function SettingsCoAView({ settings, coa, onRefresh }: SettingsCoAViewProps) {
  const [form, setForm] = useState<any>(settings || {});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/accounting/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setMsg("Settings saved.");
      onRefresh();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadTemplate() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/accounting/seed-template", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load template");
      setMsg(
        `Template verified: +${data.faInserted} Assets, +${data.swInserted} Smallwares, +${data.clInserted} Cleaning, +${data.empInserted} Staff.`
      );
      onRefresh();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredCoa = search.trim()
    ? coa.filter(
        (c) =>
          c.code.includes(search.trim()) ||
          c.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : coa;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveSettings} className="bg-[#111318] border border-white/[0.07] rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Statutory &amp; Tax Settings</h3>
            <p className="text-xs text-zinc-500">Tax Year: April 1 – March 31 • SLFRS for SMEs</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadTemplate}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg bg-[#0A0B0F] border border-white/[0.08] hover:border-white/20 text-zinc-200 text-xs font-medium cursor-pointer"
            >
              Load Kitchen Setup Template
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-medium cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {msg && <p className="text-xs text-emerald-400">{msg}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Entity Name</label>
            <input
              type="text"
              value={form.company_name || ""}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">PV Registration No.</label>
            <input
              type="text"
              value={form.company_reg_no || ""}
              placeholder="PV 00000000"
              onChange={(e) => setForm({ ...form, company_reg_no: e.target.value })}
              className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">CapEx Threshold (LKR)</label>
            <input
              type="number"
              value={form.capex_threshold || 25000}
              onChange={(e) => setForm({ ...form, capex_threshold: Number(e.target.value) })}
              className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono outline-none"
            />
          </div>

          <label className="bg-[#0A0B0F] border border-white/[0.07] rounded-lg p-3 flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-white">VAT Registered (18%)</p>
              <p className="text-[11px] text-zinc-500">Separate VAT from revenue</p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(form.vat_registered)}
              onChange={(e) => setForm({ ...form, vat_registered: e.target.checked })}
              className="w-4 h-4 accent-[#F26F21]"
            />
          </label>

          <label className="bg-[#0A0B0F] border border-white/[0.07] rounded-lg p-3 flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-white">SSCL Registered (2.5%)</p>
              <p className="text-[11px] text-zinc-500">Social Security Levy</p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(form.sscl_registered)}
              onChange={(e) => setForm({ ...form, sscl_registered: e.target.checked })}
              className="w-4 h-4 accent-[#F26F21]"
            />
          </label>

          <div>
            <label className="block text-zinc-400 mb-1">Smallwares Policy</label>
            <select
              value={form.smallwares_policy || "EXPENSE"}
              onChange={(e) => setForm({ ...form, smallwares_policy: e.target.value })}
              className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none"
            >
              <option value="EXPENSE">Immediate Expense (6210)</option>
              <option value="AMORTIZE_12M">Amortize Over 12 Months (1170)</option>
            </select>
          </div>
        </div>
      </form>

      <div className="bg-[#111318] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-semibold text-white">Chart of Accounts ({filteredCoa.length})</h3>
          <input
            type="text"
            placeholder="Filter code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-zinc-500 border-b border-white/[0.07]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Account Name</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Normal</th>
                <th className="px-4 py-2.5 font-medium text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredCoa.map((acc) => (
                <tr key={acc.code} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-mono text-zinc-300">{acc.code}</td>
                  <td className="px-4 py-2.5 text-white">{acc.name}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{acc.account_type}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{acc.normal_balance}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-200">{formatLKR2(acc.net_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
