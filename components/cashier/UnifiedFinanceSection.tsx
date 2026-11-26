"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Printer } from "lucide-react";
import { todayISO } from "@/lib/accounting/format";
import ReportsView from "@/components/accounting/ReportsView";
import LedgerView from "@/components/accounting/LedgerView";
import FixedAssetsView from "@/components/accounting/FixedAssetsView";
import PayrollSettlementsView from "@/components/accounting/PayrollSettlementsView";
import SettingsCoAView from "@/components/accounting/SettingsCoAView";
import SalesAnalyticsView from "@/components/cashier/SalesAnalyticsView";

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

  const loadAll = useCallback(async (runAutoSync = true) => {
    try {
      if (runAutoSync) {
        await fetch("/api/accounting/pos-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 500 }),
        }).catch(() => {});
      }

      const [repR, jeR, coaR, setR, faR, payR, stlR, syncR] = await Promise.all([
        fetch(`/api/accounting/reports?period=${period}&dailyDate=${dailyDate}`),
        fetch("/api/accounting/journals?limit=150"),
        fetch("/api/accounting/coa"),
        fetch("/api/accounting/settings"),
        fetch("/api/accounting/fixed-assets"),
        fetch("/api/accounting/payroll"),
        fetch("/api/accounting/settlements"),
        fetch("/api/accounting/pos-sync"),
      ]);

      if (repR.ok) setReports(await repR.json());
      if (jeR.ok) setJournals(await jeR.json());
      if (coaR.ok) setCoa(await coaR.json());
      if (setR.ok) setSettings(await setR.json());
      if (faR.ok) setAssets(await faR.json());
      if (payR.ok) setPayrollData(await payR.json());
      if (stlR.ok) setSettlementData(await stlR.json());
      if (syncR.ok) setSyncStatus(await syncR.json());
    } catch (err) {
      console.error("Failed to load finance data:", err);
    }
  }, [period, dailyDate]);

  useEffect(() => {
    loadAll(true);
  }, [loadAll, section]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111318] border border-[#1F2430] rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 text-white font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isBalanced ? "bg-emerald-400" : "bg-rose-400"
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
            className="min-h-[40px] px-3 rounded-lg bg-[#0A0B0F] border border-[#1F2430] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>
          <div className="min-h-[40px] px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
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
              className="text-emerald-300 hover:text-white cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {syncMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg("")} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {section === "REPORTS" && (
        <div className="space-y-5">
          <div className="inline-flex p-1 rounded-xl bg-[#111318] gap-1">
            <button
              type="button"
              onClick={() => setReportSubTab("SLFRS")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${
                reportSubTab === "SLFRS" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              SLFRS Financial Statements
            </button>
            <button
              type="button"
              onClick={() => setReportSubTab("ANALYTICS")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${
                reportSubTab === "ANALYTICS" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
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
          <div className="inline-flex p-1 rounded-xl bg-[#111318] border border-[#1F2430] gap-1">
            <button
              type="button"
              onClick={() => setSubAssetTab("ASSETS")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${
                subAssetTab === "ASSETS" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Fixed Assets &amp; Depreciation (CapEx)
            </button>
            <button
              type="button"
              onClick={() => setSubAssetTab("PAYROLL")}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-medium cursor-pointer transition ${
                subAssetTab === "PAYROLL" ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
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
