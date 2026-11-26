"use client";

import React, { useState } from "react";
import { formatLKR2, todayISO } from "@/lib/accounting/format";
import { Plus, RotateCcw, X } from "lucide-react";

interface LedgerViewProps {
  journals: any[];
  coa: any[];
  onRefresh: () => void;
}

export default function LedgerView({ journals, coa, onRefresh }: LedgerViewProps) {
  const [filterType, setFilterType] = useState("ALL");
  const [showDrawer, setShowDrawer] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<any | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [entryDate, setEntryDate] = useState(todayISO());
  const [referenceType, setReferenceType] = useState("EXPENSE");
  const [description, setDescription] = useState("");
  const [debitAccount, setDebitAccount] = useState("6140");
  const [creditAccount, setCreditAccount] = useState("1120");
  const [amount, setAmount] = useState("");

  async function handlePostEntry(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const numAmt = Number(amount);
    if (!description.trim() || numAmt <= 0) {
      setError("Enter a valid description and positive LKR amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate,
          referenceType,
          description,
          createdBy: "DIRECTOR",
          lines: [
            { accountCode: debitAccount, debit: numAmt, memo: description },
            { accountCode: creditAccount, credit: numAmt, memo: description },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post entry");
      setDescription("");
      setAmount("");
      setShowDrawer(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReverse(e: React.FormEvent) {
    e.preventDefault();
    if (!reverseTarget) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounting/journals/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalEntryId: reverseTarget.id,
          reason: reverseReason,
          userId: "DIRECTOR",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reversal failed");
      setReverseTarget(null);
      setReverseReason("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered =
    filterType === "ALL"
      ? journals
      : journals.filter((j) => j.reference_type === filterType);

  return (
    <div className="space-y-4">
      {/* Minimal Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#111318] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
        >
          <option value="ALL">All Journal Types</option>
          <option value="POS_SALE">POS Sales</option>
          <option value="PURCHASE">Purchases</option>
          <option value="EXPENSE">Operating Expenses</option>
          <option value="CAPEX">CapEx</option>
          <option value="DEPRECIATION">Depreciation</option>
          <option value="PAYROLL">Payroll</option>
          <option value="SETTLEMENT">Aggregator Settlements</option>
          <option value="WASTE">Waste</option>
          <option value="STOCK_ADJ">Stock-Take</option>
          <option value="REVERSAL">Reversals</option>
        </select>

        <button
          onClick={() => { setError(""); setShowDrawer(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Entry
        </button>
      </div>

      {/* Journal List */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-xl divide-y divide-white/[0.06]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-500">
            No journal entries found.
          </div>
        ) : (
          filtered.map((je) => (
            <div
              key={je.id}
              className={`p-4 space-y-2.5 ${je.status === "REVERSED" ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-mono text-zinc-300">{je.id}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">{String(je.entry_date).slice(0, 10)}</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-zinc-300">
                    {je.reference_type}
                  </span>
                  {je.status === "REVERSED" && (
                    <span className="text-[10px] text-amber-400">
                      Reversed ({je.reversed_by_id})
                    </span>
                  )}
                </div>

                {je.status === "POSTED" && je.reference_type !== "REVERSAL" && (
                  <button
                    onClick={() => { setError(""); setReverseTarget(je); }}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-amber-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reverse
                  </button>
                )}
              </div>

              <p className="text-xs font-medium text-white">{je.description}</p>

              <div className="space-y-1 pt-1">
                {(je.lines || []).map((l: any) => (
                  <div key={l.id} className="grid grid-cols-12 text-[11px] text-zinc-400">
                    <span className="col-span-6 font-mono truncate">
                      {l.account_code} {l.account_name}
                    </span>
                    <span className="col-span-3 text-right font-mono tabular-nums text-zinc-200">
                      {Number(l.debit) > 0 ? `Dr ${formatLKR2(l.debit)}` : ""}
                    </span>
                    <span className="col-span-3 text-right font-mono tabular-nums text-zinc-200">
                      {Number(l.credit) > 0 ? `Cr ${formatLKR2(l.credit)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide-Over Drawer: New Expense / Journal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#111318] border-l border-white/[0.08] h-full p-6 flex flex-col justify-between overflow-y-auto">
            <form onSubmit={handlePostEntry} className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <h3 className="text-sm font-semibold text-white">New Journal / Expense</h3>
                <button type="button" onClick={() => setShowDrawer(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Salary", dr: "6160", cr: "1120", type: "EXPENSE", desc: "Staff Salary Payment", amt: "" },
                  { label: "Light Bill", dr: "6120", cr: "1120", type: "EXPENSE", desc: "Electricity (Light Bill)", amt: "" },
                  { label: "Water Bill", dr: "6130", cr: "1120", type: "EXPENSE", desc: "NWSDB Water Bill", amt: "" },
                  { label: "LP Gas Refill", dr: "6140", cr: "1120", type: "EXPENSE", desc: "LP Gas Refill (Operational)", amt: "" },
                  { label: "Internet & Tel", dr: "6150", cr: "1120", type: "EXPENSE", desc: "Internet & Telecommunication", amt: "3000" },
                  { label: "Kitchen Rent", dr: "6110", cr: "1120", type: "EXPENSE", desc: "Monthly Kitchen Rent", amt: "" },
                  { label: "Smallwares", dr: "6400", cr: "1110", type: "EXPENSE", desc: "Kitchen Smallwares & Utensils", amt: "" },
                  { label: "Cleaning", dr: "6500", cr: "1110", type: "EXPENSE", desc: "Cleaning & Hygiene Supplies", amt: "" },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setDebitAccount(p.dr);
                      setCreditAccount(p.cr);
                      setReferenceType(p.type);
                      setDescription(p.desc);
                      if (p.amt) setAmount(p.amt);
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#0A0B0F] border border-white/[0.08] hover:border-white/20 text-[11px] text-zinc-300 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg">{error}</p>}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Date</label>
                  <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Type</label>
                  <select value={referenceType} onChange={(e) => setReferenceType(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none">
                    <option value="EXPENSE">Operating Expense (OpEx)</option>
                    <option value="MANUAL">Manual / Capital / Director Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Amount (LKR)</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Debit Account (Dr)</label>
                  <select value={debitAccount} onChange={(e) => setDebitAccount(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none">
                    {coa.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Credit Account (Cr)</label>
                  <select value={creditAccount} onChange={(e) => setCreditAccount(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none">
                    {coa.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Description</label>
                  <input type="text" required placeholder="Narration..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.07]">
                <button type="button" onClick={() => setShowDrawer(false)} className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-[#F26F21] text-white text-xs font-medium cursor-pointer disabled:opacity-50">
                  {submitting ? "Posting..." : "Post Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {reverseTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleReverse} className="w-full max-w-md bg-[#111318] border border-white/[0.08] rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-white">Reverse {reverseTarget.id}</h4>
            <p className="text-xs text-zinc-400">
              Posts an audit-compliant mirror reversal entry. Hard deletion is prohibited.
            </p>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <input
              type="text"
              required
              placeholder="Mandatory reason (e.g. Duplicate entry)"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReverseTarget(null)} className="px-3 py-1.5 text-xs text-zinc-400 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-semibold cursor-pointer">
                Confirm Reversal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
