"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, Printer } from "lucide-react";
import { todayISO } from "@/lib/accounting/format";

const FinanceLoader = () => (
  <div className="p-8 text-center text-xs text-slate-500">Loading section...</div>
);

const ReportsView = dynamic(() => import("@/components/accounting/ReportsView"), { ssr: false, loading: FinanceLoader });
const LedgerView = dynamic(() => import("@/components/accounting/LedgerView"), { ssr: false, loading: FinanceLoader });
const FixedAssetsView = dynamic(() => import("@/components/accounting/FixedAssetsView"), { ssr: false, loading: FinanceLoader });
const PayrollSettlementsView = dynamic(() => import("@/components/accounting/PayrollSettlementsView"), { ssr: false, loading: FinanceLoader });
const SettingsCoAView = dynamic(() => import("@/components/accounting/SettingsCoAView"), { ssr: false, loading: FinanceLoader });
const SalesAnalyticsView = dynamic(() => import("@/components/cashier/SalesAnalyticsView"), { ssr: false, loading: FinanceLoader });

interface UnifiedFinanceSectionProps {
  section: "REPORTS" | "LEDGER" | "ASSETS_PAYROLL" | "SETTINGS";
}

export default function UnifiedFinanceSection({ section }: UnifiedFinanceSectionProps) {
  const [period, setPeriod] = useState("MONTH");
  const [dailyDate, setDailyDate] = useState(todayISO());
  const [reportSubTab, setReportSubTab] = useState<"SLFRS" | "ANALYTICS">("SLFRS");
  const [subAssetTab, setSubAssetTab] = useState<"ASSETS" | "PAYROLL">("ASSETS");

  const [reports, setReports] = useState<any>(null);
  const [journals, setJournals] = useState<any[]>([]);
  const [coa, setCoa] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<{
    totalValidOrders: number;
    postedOrders: number;
    unpostedOrders: number;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  // Hydrate finance views from localStorage cache immediately (0ms initial render)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("t-cloud-eats-finance-cache");
      if (!raw) return;
      const c = JSON.parse(raw);
      if (c.reports) setReports(c.reports);
      if (Array.isArray(c.journals)) setJournals(c.journals);
      if (Array.isArray(c.coa)) setCoa(c.coa);
      if (c.settings) setSettings(c.settings);
      if (Array.isArray(c.assets)) setAssets(c.assets);
      if (c.payrollData) setPayrollData(c.payrollData);
      if (c.settlementData) setSettlementData(c.settlementData);
      if (c.syncStatus) setSyncStatus(c.syncStatus);
    } catch {
      // Ignore cache parse errors
    }
  }, []);

  const saveCache = useCallback((patch: Record<string, any>) => {
    try {
      const raw = localStorage.getItem("t-cloud-eats-finance-cache");
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem("t-cloud-eats-finance-cache", JSON.stringify({ ...prev, ...patch }));
    } catch {
      // Ignore quota errors
    }
  }, []);

  const loadAll = useCallback(async (runAutoSync = true) => {
    try {
      const fetchJson = async (url: string, apply: (data: any) => void) => {
        try {
          const r = await fetch(url);
          if (r.ok) apply(await r.json());
        } catch {
          // Ignore individual fetch errors
        }
      };

      const tasks: Promise<void>[] = [
        fetchJson("/api/accounting/pos-sync", (d) => { setSyncStatus(d); saveCache({ syncStatus: d }); }),
      ];

      if (section === "REPORTS") {
        tasks.push(
          fetchJson(`/api/accounting/reports?period=${period}&dailyDate=${dailyDate}`, (d) => { setReports(d); saveCache({ reports: d }); })
        );
      } else if (section === "LEDGER") {
        tasks.push(
          fetchJson("/api/accounting/journals?limit=150", (d) => { setJournals(d); saveCache({ journals: d }); }),
          fetchJson("/api/accounting/coa", (d) => { setCoa(d); saveCache({ coa: d }); })
        );
      } else if (section === "ASSETS_PAYROLL") {
        tasks.push(
          fetchJson("/api/accounting/fixed-assets", (d) => { setAssets(d); saveCache({ assets: d }); }),
          fetchJson("/api/accounting/payroll", (d) => { setPayrollData(d); saveCache({ payrollData: d }); }),
          fetchJson("/api/accounting/settlements", (d) => { setSettlementData(d); saveCache({ settlementData: d }); }),
          fetchJson("/api/accounting/coa", (d) => { setCoa(d); saveCache({ coa: d }); })
        );
      } else if (section === "SETTINGS") {
        tasks.push(
          fetchJson("/api/accounting/settings", (d) => { setSettings(d); saveCache({ settings: d }); }),
          fetchJson("/api/accounting/coa", (d) => { setCoa(d); saveCache({ coa: d }); })
        );
      }

      await Promise.all(tasks);

      if (runAutoSync) {
        fetch("/api/accounting/pos-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 500 }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d && d.syncedCount > 0) {
              loadAll(false);
            }
          })
          .catch(() => { });
      }
    } catch (err) {
      console.error("Failed to load finance data:", err);
    }
  }, [period, dailyDate, section, saveCache]);

  const hasMountedRef = useRef(false);
  useEffect(() => {
    const shouldAutoSync = !hasMountedRef.current;
    hasMountedRef.current = true;
    loadAll(shouldAutoSync);
  }, [loadAll]);

  async function handlePosSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/accounting/pos-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 300 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncMsg(`Synced ${data.syncedCount} POS orders to General Ledger.`);
      await loadAll();
    } catch (err: any) {
      setSyncMsg(err.message);
    } finally {
      setSyncing(false);
    }
  }

  const isBalanced = reports?.trialBalance?.isBalanced ?? true;
  const pendingOrders = syncStatus?.unpostedOrders ?? 0;

  return (
    <div className="space-y-5">
      {/* Top Finance Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 text-slate-900 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${isBalanced ? "bg-emerald-400" : "bg-rose-400"
                }`}
            />
            {isBalanced ? "Trial Balance: Balanced" : "Trial Balance: Variance"}
          </span>
          <span>•</span>
          <span>{reports?.meta?.fiscalYear || "FY2026/27"}</span>
          <span>•</span>
          <span>{settings?.vat_registered ? "VAT 18% Active" : "Pre-VAT"}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[40px] px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>
          <div className="min-h-[40px] px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>
              {syncing
                ? "Syncing..."
                : pendingOrders > 0
                  ? `Syncing (${pendingOrders})`
                  : "Synced with POS"}
            </span>
            <button
              type="button"
              onClick={handlePosSync}
              disabled={syncing}
              title="Re-check POS Sync"
              className="text-emerald-700 hover:text-slate-900 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {syncMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg("")} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {section === "REPORTS" && (
        <div className="space-y-5">
          <div className="inline-flex p-1 rounded-xl bg-white gap-1">
            <button
              type="button"
              onClick={() => setReportSubTab("SLFRS")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${reportSubTab === "SLFRS" ? "bg-sky-500 text-white text-white" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              SLFRS Financial Statements
            </button>
            <button
              type="button"
              onClick={() => setReportSubTab("ANALYTICS")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${reportSubTab === "ANALYTICS" ? "bg-sky-500 text-white text-white" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Sales &amp; Dish Performance
            </button>
          </div>

          {reportSubTab === "SLFRS" ? (
            <ReportsView
              reports={reports}
              period={period}
              setPeriod={setPeriod}
              dailyDate={dailyDate}
              setDailyDate={setDailyDate}
              onRefresh={loadAll}
            />
          ) : (
            <SalesAnalyticsView onRefreshParent={() => loadAll(true)} />
          )}
        </div>
      )}

      {section === "LEDGER" && (
        <LedgerView journals={journals} coa={coa} onRefresh={loadAll} />
      )}

      {section === "ASSETS_PAYROLL" && (
        <div className="space-y-5">
          <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setSubAssetTab("ASSETS")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${subAssetTab === "ASSETS" ? "bg-sky-500 text-white text-white" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Fixed Assets &amp; Depreciation (CapEx)
            </button>
            <button
              type="button"
              onClick={() => setSubAssetTab("PAYROLL")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${subAssetTab === "PAYROLL" ? "bg-sky-500 text-white text-white" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Payroll (EPF/ETF/APIT) &amp; Aggregators
            </button>
          </div>

          {subAssetTab === "ASSETS" ? (
            <FixedAssetsView
              assets={assets}
              capexThreshold={Number(settings?.capex_threshold || 25000)}
              onRefresh={loadAll}
            />
          ) : (
            <PayrollSettlementsView
              payrollData={payrollData}
              settlementData={settlementData}
              onRefresh={loadAll}
            />
          )}
        </div>
      )}

      {section === "SETTINGS" && (
        <SettingsCoAView settings={settings} coa={coa} onRefresh={loadAll} />
      )}
    </div>
  );
}
