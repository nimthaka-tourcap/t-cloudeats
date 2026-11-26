"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Merge, Search } from "lucide-react";
import { formatLKR2 } from "@/lib/utils/currency";
import MergeDishesModal from "./MergeDishesModal";

interface SalesAnalyticsViewProps {
  categories?: string[];
  onRefreshParent?: () => void;
}

export default function SalesAnalyticsView({
  categories = ["Fried Rice", "Chopsuey", "Kottu", "Pasta", "Ultimate Bites", "Beverages"],
  onRefreshParent,
}: SalesAnalyticsViewProps) {
  const [range, setRange] = useState<"7_days" | "this_month" | "30_days" | "custom">("30_days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dishSearch, setDishSearch] = useState("");
  const [dishCategory, setDishCategory] = useState("ALL");
  const [expandedDish, setExpandedDish] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeBanner, setMergeBanner] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (range === "custom" && startDate && endDate) {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }
      const res = await fetch(`/api/accounting/sales-analytics?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to load sales analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportCsv = () => {
    if (!data?.dishes) return;
    const headers = ["Dish,Category,Qty Sold,Revenue (LKR),Share %"];
    const rows = data.dishes.map(
      (d: any) => `"${d.title}","${d.category}",${d.qtySold},${d.revenue},${d.sharePct}%`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tce-dish-sales-${data.meta.startDate}-to-${data.meta.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const weekdayRows = data?.weekdayBreakdown || [];
  const dailyRows = data?.dailyRows || [];
  const allDishes = data?.dishes || [];
  const filteredDishes = allDishes.filter((d: any) => {
    const matchQ = d.title.toLowerCase().includes(dishSearch.toLowerCase());
    const matchC = dishCategory === "ALL" || d.category === dishCategory;
    return matchQ && matchC;
  });

  return (
    <div className="space-y-6">
      {/* Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#111318] gap-1">
          {[
            { id: "7_days", label: "Last 7 Days" },
            { id: "this_month", label: "This Month" },
            { id: "30_days", label: "Last 30 Days" },
            { id: "custom", label: "Custom" },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id as any)}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                range === r.id ? "bg-[#1C1F26] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-h-[40px] bg-[#111318] rounded-lg px-3 text-white outline-none"
              style={{ colorScheme: "dark" }}
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="min-h-[40px] bg-[#111318] rounded-lg px-3 text-white outline-none"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}
      </div>

      {mergeBanner && (
        <div className="bg-emerald-500/10 text-emerald-300 px-4 py-3 rounded-xl text-xs flex justify-between items-center">
          <span>{mergeBanner}</span>
          <button onClick={() => setMergeBanner("")} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Sunday - Saturday Breakdown */}
      <div className="bg-[#111318] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Everyday Sales (Sunday – Saturday)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              1:00 AM business-day cutoff • {data?.meta?.startDate} to {data?.meta?.endDate}
            </p>
          </div>
        </div>

        {loading && !data ? (
          <p className="text-xs text-zinc-500 py-6">Loading weekday breakdown...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekdayRows.map((wb: any) => (
              <div
                key={wb.dayIndex}
                className={`rounded-xl p-4 space-y-1.5 ${
                  wb.isPeak
                    ? "bg-[#F26F21]/15 border border-[#F26F21]/40"
                    : "bg-[#0A0B0F]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{wb.shortName}</span>
                  {wb.isPeak && (
                    <span className="text-[11px] text-[#F26F21] font-medium">Peak</span>
                  )}
                </div>
                <p className="text-sm font-semibold font-mono tabular-nums text-white">
                  {formatLKR2(wb.netRevenue)}
                </p>
                <p className="text-xs text-zinc-400">
                  {wb.orderCount} orders • Avg {formatLKR2(wb.avgOrderValue)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Daily Date Rows */}
        {dailyRows.length > 0 && (
          <div className="overflow-x-auto pt-2 border-t border-white/[0.06]">
            <table className="w-full text-xs text-left">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-2.5 font-medium">Business Date</th>
                  <th className="py-2.5 font-medium text-right">Orders</th>
                  <th className="py-2.5 font-medium text-right">Gross Sales</th>
                  <th className="py-2.5 font-medium text-right">Net Revenue</th>
                  <th className="py-2.5 font-medium text-right">Avg Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {dailyRows.slice(0, 14).map((r: any) => (
                  <tr key={r.dateStr} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-mono text-zinc-200">
                      {r.dateStr} ({r.shortName})
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-zinc-300">
                      {r.orderCount}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-zinc-300">
                      {formatLKR2(r.grossSales)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-medium text-emerald-400">
                      {formatLKR2(r.netRevenue)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-zinc-400">
                      {formatLKR2(r.avgOrderValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dish-by-Dish Sales Counter */}
      <div className="bg-[#111318] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Dish-by-Dish Sales Counter ({data?.meta?.totalUnitsSold || 0} portions sold)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Click any dish row to view Sunday–Saturday unit distribution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMergeModal(true)}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#F26F21] hover:bg-[#e06117] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Merge size={14} /> Merge Dishes
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#0A0B0F] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search dish..."
              value={dishSearch}
              onChange={(e) => setDishSearch(e.target.value)}
              className="min-h-[42px] w-full bg-[#0A0B0F] rounded-xl pl-9 pr-3 text-xs text-white outline-none"
            />
          </div>
          <select
            value={dishCategory}
            onChange={(e) => setDishCategory(e.target.value)}
            className="min-h-[42px] bg-[#0A0B0F] rounded-xl px-3.5 text-xs text-white outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-zinc-500 border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 font-medium">Dish Name</th>
                <th className="py-2.5 font-medium">Category</th>
                <th className="py-2.5 font-medium text-right">Portions Sold</th>
                <th className="py-2.5 font-medium text-right">Dish Revenue</th>
                <th className="py-2.5 font-medium text-right">Share %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredDishes.map((d: any) => {
                const isExp = expandedDish === d.title;
                return (
                  <React.Fragment key={d.title}>
                    <tr
                      onClick={() => setExpandedDish(isExp ? null : d.title)}
                      className="hover:bg-white/[0.02] cursor-pointer"
                    >
                      <td className="py-3 font-medium text-white">{d.title}</td>
                      <td className="py-3 text-zinc-400">{d.category}</td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-[#F26F21]">
                        {d.qtySold}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-emerald-400">
                        {formatLKR2(d.revenue)}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-zinc-400">
                        {d.sharePct.toFixed(1)}%
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="bg-[#0A0B0F]">
                        <td colSpan={5} className="p-3">
                          <div className="grid grid-cols-7 gap-2 text-center">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                              <div key={day} className="rounded-lg bg-[#111318] py-2">
                                <p className="text-[11px] text-zinc-500">{day}</p>
                                <p className="font-mono font-semibold text-white mt-0.5">
                                  {d.weekdayUnits?.[idx] || 0}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MergeDishesModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        availableDishTitles={allDishes.map((d: any) => ({
          title: d.title,
          category: d.category,
        }))}
        categories={categories}
        onMerged={(msg) => {
          setMergeBanner(msg);
          loadAnalytics();
          if (onRefreshParent) onRefreshParent();
        }}
      />
    </div>
  );
}
