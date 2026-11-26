"use client";

import React, { useState } from "react";
import { formatLKR2, todayISO } from "@/lib/accounting/format";
import { calculateSriLankaPayroll } from "@/lib/accounting/payroll";
import { Plus, Play, X, Pencil, Trash2 } from "lucide-react";

interface PayrollSettlementsViewProps {
  payrollData: { employees: any[]; runs: any[] } | null;
  settlementData: { settlements: any[]; receivableBalances: { uberEats: number; pickMeFood: number } } | null;
  onRefresh: () => void;
}

export default function PayrollSettlementsView({
  payrollData,
  settlementData,
  onRefresh,
}: PayrollSettlementsViewProps) {
  const [subTab, setSubTab] = useState<"PAYROLL" | "AGGREGATOR">("PAYROLL");

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Line Chef");
  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState("0");
  const [apitApplicable, setApitApplicable] = useState(false);
  const [payPeriod, setPayPeriod] = useState(todayISO().slice(0, 7));

  const [platform, setPlatform] = useState<"UBER_EATS" | "PICKME">("UBER_EATS");
  const [settlementDate, setSettlementDate] = useState(todayISO());
  const [netPayout, setNetPayout] = useState("");
  const [refNo, setRefNo] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/payroll", {
        method: editingEmpId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingEmpId ? { id: editingEmpId } : { action: "ADD_EMPLOYEE" }),
          full_name: fullName,
          role,
          basic_salary: Number(basicSalary),
          allowances: Number(allowances || 0),
          apit_applicable: apitApplicable,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save employee");
      setShowAddEmp(false);
      setEditingEmpId(null);
      setFullName("");
      setBasicSalary("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteEmployee(id: string, name: string) {
    if (!window.confirm(`Deactivate employee "${name}"?`)) return;
    try {
      const res = await fetch(`/api/accounting/payroll?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRunPayroll() {
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_PAYROLL", pay_period: payPeriod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payroll run failed");
      setMsg(
        `Posted ${payPeriod} Payroll (${data.journalEntryId}): Net ${formatLKR2(data.totalNet)}, EPF ${formatLKR2(data.totalEpfPayable)}, ETF ${formatLKR2(data.totalEtfEr3)}`
      );
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSettle(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/accounting/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          settlement_date: settlementDate,
          net_payout_received: Number(netPayout),
          reference_no: refNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Settlement failed");
      setNetPayout("");
      setRefNo("");
      setMsg(`Reconciled ${platform} payout (${data.journalEntryId})`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-lg bg-[#111318] border border-white/[0.07]">
          <button
            onClick={() => setSubTab("PAYROLL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              subTab === "PAYROLL" ? "bg-[#1C1F26] text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Payroll (EPF / ETF / APIT)
          </button>
          <button
            onClick={() => setSubTab("AGGREGATOR")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              subTab === "AGGREGATOR" ? "bg-[#1C1F26] text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Aggregator Payouts
          </button>
        </div>

        {subTab === "PAYROLL" && payrollData && (
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              className="bg-[#111318] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
            />
            <button
              onClick={handleRunPayroll}
              disabled={busy || payrollData.employees.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111318] border border-white/[0.08] hover:bg-white/[0.05] text-zinc-200 text-xs font-medium disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-3 h-3" /> Run Payroll
            </button>
            <button
              onClick={() => setShowAddEmp(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff
            </button>
          </div>
        )}
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-2.5 rounded-lg text-xs">{error}</div>}
      {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-2.5 rounded-lg text-xs">{msg}</div>}

      {subTab === "PAYROLL" && payrollData && (
        <div className="bg-[#111318] border border-white/[0.07] rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-zinc-500 border-b border-white/[0.07]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium text-right">Gross</th>
                <th className="px-4 py-2.5 font-medium text-right">EPF 8%</th>
                <th className="px-4 py-2.5 font-medium text-right">APIT</th>
                <th className="px-4 py-2.5 font-medium text-right">Net Pay</th>
                <th className="px-4 py-2.5 font-medium text-right">EPF 12%</th>
                <th className="px-4 py-2.5 font-medium text-right">ETF 3%</th>
                <th className="px-4 py-2.5 font-medium text-right">Total Cost</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {payrollData.employees.filter((e) => e.is_active !== false).length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-500">No active employees added yet.</td>
                </tr>
              ) : (
                payrollData.employees.filter((e) => e.is_active !== false).map((emp) => {
                  const c = calculateSriLankaPayroll(Number(emp.basic_salary), Number(emp.allowances), emp.apit_applicable);
                  return (
                    <tr key={emp.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white font-medium">{emp.full_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{emp.role}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-200">{formatLKR2(c.grossSalary)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-400">{formatLKR2(c.epfEmployee8)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-400">{formatLKR2(c.apitTax)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-emerald-400">{formatLKR2(c.netSalary)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-400">{formatLKR2(c.epfEmployer12)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-400">{formatLKR2(c.etfEmployer3)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-white">{formatLKR2(c.totalEmployerCost)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmpId(emp.id);
                              setFullName(emp.full_name);
                              setRole(emp.role);
                              setBasicSalary(String(emp.basic_salary));
                              setAllowances(String(emp.allowances || 0));
                              setApitApplicable(Boolean(emp.apit_applicable));
                              setShowAddEmp(true);
                            }}
                            className="p-1.5 rounded-lg bg-[#0A0B0F] border border-white/[0.08] text-zinc-300 hover:text-white cursor-pointer"
                            title="Edit Staff"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white cursor-pointer transition"
                            title="Remove Staff"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "AGGREGATOR" && settlementData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111318] border border-white/[0.07] rounded-xl p-4">
              <p className="text-[11px] text-zinc-400">1130 — Uber Eats Receivable</p>
              <p className="text-xl font-semibold text-white font-mono tabular-nums mt-1">
                {formatLKR2(settlementData.receivableBalances.uberEats)}
              </p>
            </div>
            <div className="bg-[#111318] border border-white/[0.07] rounded-xl p-4">
              <p className="text-[11px] text-zinc-400">1131 — PickMe Food Receivable</p>
              <p className="text-xl font-semibold text-white font-mono tabular-nums mt-1">
                {formatLKR2(settlementData.receivableBalances.pickMeFood)}
              </p>
            </div>
          </div>

          <form onSubmit={handleSettle} className="bg-[#111318] border border-white/[0.07] rounded-xl p-4 flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as any)} className="bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none">
                <option value="UBER_EATS">Uber Eats (1130)</option>
                <option value="PICKME">PickMe Food (1131)</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Date</label>
              <input type="date" value={settlementDate} onChange={(e) => setSettlementDate(e.target.value)} className="bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-zinc-400 mb-1">Net Payout Received (LKR)</label>
              <input type="number" step="0.01" required placeholder="0.00" value={netPayout} onChange={(e) => setNetPayout(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono outline-none" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-zinc-400 mb-1">Bank Reference</label>
              <input type="text" placeholder="Ref #" value={refNo} onChange={(e) => setRefNo(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none" />
            </div>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#F26F21] text-white font-medium cursor-pointer">
              Reconcile
            </button>
          </form>

          <div className="bg-[#111318] border border-white/[0.07] rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-zinc-500 border-b border-white/[0.07]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Platform</th>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  <th className="px-4 py-2.5 font-medium text-right">Net Payout</th>
                  <th className="px-4 py-2.5 font-medium">Journal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {settlementData.settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-zinc-400">{String(s.settlement_date).slice(0, 10)}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{s.platform}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{s.reference_no || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-400">{formatLKR2(s.net_payout_received)}</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-400">{s.journal_entry_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddEmp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <form onSubmit={handleAddEmployee} className="w-full max-w-md bg-[#111318] border-l border-white/[0.08] h-full p-6 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <h4 className="text-sm font-semibold text-white">Add Staff Member</h4>
                <button type="button" onClick={() => setShowAddEmp(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none" />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Role</label>
                <input type="text" required value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Basic Salary (LKR)</label>
                  <input type="number" required value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Allowances (LKR)</label>
                  <input type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} className="w-full bg-[#0A0B0F] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-zinc-300 pt-1">
                <input type="checkbox" checked={apitApplicable} onChange={(e) => setApitApplicable(e.target.checked)} className="accent-[#F26F21]" />
                Apply IRD APIT Withholding
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.07]">
              <button type="button" onClick={() => setShowAddEmp(false)} className="px-4 py-2 text-xs text-zinc-400 cursor-pointer">Cancel</button>
              <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#F26F21] text-white text-xs font-medium cursor-pointer">Save Staff</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
