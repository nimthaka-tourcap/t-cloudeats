"use client";

import React, { useState } from "react";
import { formatLKR2 } from "@/lib/accounting/format";

interface ReportsViewProps {
  reports: any;
  period: string;
  setPeriod: (p: string) => void;
  dailyDate: string;
  setDailyDate: (d: string) => void;
  onRefresh: () => void;
}

export default function ReportsView({
  reports,
  period,
  setPeriod,
  dailyDate,
  setDailyDate,
  onRefresh,
}: ReportsViewProps) {
  const [subTab, setSubTab] = useState<"PNL" | "BS" | "TB" | "DAILY">("PNL");

  if (!reports) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading SLFRS Financial Statements...
      </div>
    );
  }

  const { dailyPosSummary: daily, pnl, trialBalance: tb, balanceSheet: bs, meta } = reports;

  return (
    <div className="space-y-6">
      {/* Segmented Switcher + Period Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-lg bg-white border border-slate-200">
          {[
            { id: "PNL", label: "P&L Statement" },
            { id: "BS", label: "Balance Sheet" },
            { id: "TB", label: "Trial Balance" },
            { id: "DAILY", label: "Daily POS" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                subTab === t.id
                  ? "bg-sky-500 text-white text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {subTab === "DAILY" && (
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
            />
          )}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
          >
            <option value="MONTH">Current Month</option>
            <option value="QUARTER">Current Quarter</option>
            <option value="FY">Tax Year ({meta?.fiscalYear})</option>
          </select>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* DAILY POS SUMMARY */}
      {subTab === "DAILY" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Gross Sales ({dailyDate})</p>
              <p className="text-xl font-semibold text-slate-900 font-mono tabular-nums mt-1">{formatLKR2(daily.grossSales)}</p>
              <p className="text-[11px] text-slate-500 mt-1">{daily.orderCount} orders</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Net Sales</p>
              <p className="text-xl font-semibold text-emerald-600 font-mono tabular-nums mt-1">{formatLKR2(daily.netSales)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Fees: {formatLKR2(daily.aggregatorCommissions)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Theoretical Food Cost %</p>
              <p className="text-xl font-semibold text-slate-900 font-mono tabular-nums mt-1">{daily.foodCostPct.toFixed(2)}%</p>
              <p className="text-[11px] text-slate-500 mt-1">COGS: {formatLKR2(daily.theoreticalCogs)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] text-slate-500">Gross Margin %</p>
              <p className="text-xl font-semibold text-emerald-600 font-mono tabular-nums mt-1">{daily.grossMarginPct.toFixed(2)}%</p>
              <p className="text-[11px] text-slate-500 mt-1">Net Sales less COGS</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 text-xs">
            <div className="flex justify-between px-4 py-3">
              <span className="text-slate-500">1110 – Cash in Hand Split</span>
              <span className="font-mono tabular-nums text-slate-900">{formatLKR2(daily.splits.cash)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-slate-500">1120 – Bank / HelaPOS / Card Split</span>
              <span className="font-mono tabular-nums text-slate-900">{formatLKR2(daily.splits.bankCard)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-slate-500">1130/1131 – Aggregator Receivables (Net)</span>
              <span className="font-mono tabular-nums text-slate-900">{formatLKR2(daily.splits.aggregator)}</span>
            </div>
          </div>
        </div>
      )}

      {/* P&L (INCOME STATEMENT) */}
      {subTab === "PNL" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-slate-900">Statement of Profit or Loss</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {meta.startDate} to {meta.endDate} ({meta.fiscalYear}) • SLFRS for SMEs • Tax-Exclusive
            </p>
          </div>

          <div className="space-y-5 text-xs">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Revenue</p>
              {pnl.revenueItems.length === 0 ? (
                <p className="text-slate-500 py-2">No revenue posted in this period.</p>
              ) : (
                pnl.revenueItems.map((item: any) => (
                  <div key={item.code} className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-700">{item.code} — {item.name}</span>
                    <span className="font-mono tabular-nums text-slate-800">{formatLKR2(item.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between py-2 font-semibold text-slate-900">
                <span>Net Revenue</span>
                <span className="font-mono tabular-nums">{formatLKR2(pnl.netRevenue)}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Cost of Goods Sold</p>
              {pnl.cogsItems.map((item: any) => (
                <div key={item.code} className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-700">{item.code} — {item.name}</span>
                  <span className="font-mono tabular-nums text-slate-800">{formatLKR2(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-semibold text-slate-800">
                <span>Total COGS</span>
                <span className="font-mono tabular-nums">{formatLKR2(pnl.totalCogs)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-emerald-600">
              <span>Gross Profit</span>
              <span className="font-mono tabular-nums">{formatLKR2(pnl.grossProfit)}</span>
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">Operating Expenses</p>
              {pnl.opexItems.map((item: any) => (
                <div key={item.code} className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-700">{item.code} — {item.name}</span>
                  <span className="font-mono tabular-nums text-slate-800">{formatLKR2(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-semibold text-slate-800">
                <span>Total OpEx (Excl. Depreciation)</span>
                <span className="font-mono tabular-nums">{formatLKR2(pnl.totalOpexExclDep)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-200 font-semibold text-slate-800">
              <span>EBITDA</span>
              <span className="font-mono tabular-nums">{formatLKR2(pnl.ebitda)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-500">
              <span>6300 — Depreciation Expense</span>
              <span className="font-mono tabular-nums">{formatLKR2(pnl.totalDepreciation)}</span>
            </div>

            <div className="flex justify-between py-3 px-4 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-sm text-slate-900">
              <span>Net Profit / (Loss) Before Tax</span>
              <span className="font-mono tabular-nums text-emerald-600">{formatLKR2(pnl.netProfitBeforeTax)}</span>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE SHEET */}
      {subTab === "BS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Statement of Financial Position</h3>
              <p className="text-xs text-slate-500 mt-0.5">As of {meta.endDate} • SLFRS for SMEs</p>
            </div>
            <span className={`text-xs font-medium ${bs.isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
              {bs.isBalanced ? "Balanced" : "Out of Balance"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Non-Current Assets</p>
                {bs.nonCurrentAssets.map((a: any) => (
                  <div key={a.code} className="flex justify-between py-1.5 border-b border-slate-200 text-slate-700">
                    <span>{a.code} — {a.name}</span>
                    <span className="font-mono tabular-nums">{formatLKR2(a.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-slate-900">
                  <span>Net Non-Current Assets</span>
                  <span className="font-mono tabular-nums">{formatLKR2(bs.totalNonCurrentAssets)}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Current Assets</p>
                {bs.currentAssets.map((a: any) => (
                  <div key={a.code} className="flex justify-between py-1.5 border-b border-slate-200 text-slate-700">
                    <span>{a.code} — {a.name}</span>
                    <span className="font-mono tabular-nums">{formatLKR2(a.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-slate-900">
                  <span>Total Current Assets</span>
                  <span className="font-mono tabular-nums">{formatLKR2(bs.totalCurrentAssets)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-sm text-slate-900">
                <span>Total Assets</span>
                <span className="font-mono tabular-nums text-emerald-600">{formatLKR2(bs.totalAssets)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Equity</p>
                {bs.equityItems.map((e: any) => (
                  <div key={e.code} className="flex justify-between py-1.5 border-b border-slate-200 text-slate-700">
                    <span>{e.code} — {e.name}</span>
                    <span className="font-mono tabular-nums">{formatLKR2(e.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-slate-900">
                  <span>Total Equity</span>
                  <span className="font-mono tabular-nums">{formatLKR2(bs.totalEquity)}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Non-Current Liabilities</p>
                {bs.nonCurrentLiabilities.map((l: any) => (
                  <div key={l.code} className="flex justify-between py-1.5 border-b border-slate-200 text-slate-700">
                    <span>{l.code} — {l.name}</span>
                    <span className="font-mono tabular-nums">{formatLKR2(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-slate-900">
                  <span>Total Non-Current Liabilities</span>
                  <span className="font-mono tabular-nums">{formatLKR2(bs.totalNonCurrentLiab)}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Current Liabilities</p>
                {bs.currentLiabilities.map((l: any) => (
                  <div key={l.code} className="flex justify-between py-1.5 border-b border-slate-200 text-slate-700">
                    <span>{l.code} — {l.name}</span>
                    <span className="font-mono tabular-nums">{formatLKR2(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-slate-900">
                  <span>Total Current Liabilities</span>
                  <span className="font-mono tabular-nums">{formatLKR2(bs.totalCurrentLiab)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-sm text-slate-900">
                <span>Total Equity &amp; Liabilities</span>
                <span className="font-mono tabular-nums text-emerald-600">{formatLKR2(bs.totalEquityAndLiabilities)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRIAL BALANCE */}
      {subTab === "TB" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-900">Trial Balance as of {meta.endDate}</span>
            <span className={`text-xs font-medium ${tb.isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
              {tb.isBalanced ? "Debits == Credits" : `Variance: ${formatLKR2(tb.variance)}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Account</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium text-right">Debit</th>
                  <th className="px-4 py-2.5 font-medium text-right">Credit</th>
                  <th className="px-4 py-2.5 font-medium text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tb.rows.map((r: any) => (
                  <tr key={r.code} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{r.code}</td>
                    <td className="px-4 py-2.5 text-slate-800">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.account_type}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700">{formatLKR2(r.debit)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700">{formatLKR2(r.credit)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-slate-900">{formatLKR2(r.net_balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <tr>
                  <td colSpan={3} className="px-4 py-3">Totals</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-600">{formatLKR2(tb.totalDebits)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-600">{formatLKR2(tb.totalCredits)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">{formatLKR2(tb.variance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
