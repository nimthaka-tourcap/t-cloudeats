import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { round2 } from "@/lib/accounting/format";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Computes Sri Lanka (Asia/Colombo) business date with 1:00 AM cutoff.
 * 00:00 - 00:59 counts as previous day's shift.
 */
function getColomboBizDate(isoTimestamp: string | Date): { dateStr: string; dayIndex: number } {
  const utc = new Date(isoTimestamp);
  // Shift to UTC+05:30, then subtract 1 hour for 1:00 AM rollover
  const shifted = new Date(utc.getTime() + 4.5 * 60 * 60 * 1000);
  const dateStr = shifted.toISOString().slice(0, 10);
  const dayIndex = shifted.getUTCDay(); // 0=Sun..6=Sat
  return { dateStr, dayIndex };
}

function getTodayColomboDate(): string {
  return getColomboBizDate(new Date()).dateStr;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30_days";
    const todayStr = getTodayColomboDate();

    let startDate = searchParams.get("startDate") || "";
    let endDate = searchParams.get("endDate") || todayStr;

    if (range === "7_days") {
      const d = new Date(`${todayStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 6);
      startDate = d.toISOString().slice(0, 10);
      endDate = todayStr;
    } else if (range === "this_month") {
      startDate = `${todayStr.slice(0, 7)}-01`;
      endDate = todayStr;
    } else if (range === "30_days" || !startDate) {
      const d = new Date(`${todayStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 29);
      startDate = d.toISOString().slice(0, 10);
      endDate = todayStr;
    }

    const pool = getPool();
    // Fetch valid orders (excluding Voided, Cancelled, Ignored)
    const ordersRes = await pool.query(
      `SELECT id, timestamp, items, subtotal, total, status, type
       FROM tce_orders
       WHERE LOWER(COALESCE(status, '')) NOT IN ('voided', 'cancelled', 'ignored')
       ORDER BY timestamp DESC`
    );

    const weekdayBuckets = WEEKDAYS.map((name, idx) => ({
      dayIndex: idx,
      dayName: name,
      shortName: SHORT_DAYS[idx],
      orderCount: 0,
      grossSales: 0,
      netRevenue: 0,
      avgOrderValue: 0,
      isPeak: false,
    }));

    const dailyMap = new Map<
      string,
      { dateStr: string; dayIndex: number; shortName: string; orderCount: number; grossSales: number; netRevenue: number }
    >();

    const dishMap = new Map<
      string,
      {
        title: string;
        category: string;
        qtySold: number;
        revenue: number;
        weekdayUnits: number[];
      }
    >();

    let totalUnitsSold = 0;

    for (const o of ordersRes.rows) {
      const { dateStr, dayIndex } = getColomboBizDate(o.timestamp);
      if (dateStr < startDate || dateStr > endDate) continue;

      const sub = Number(o.subtotal || 0);
      const tot = Number(o.total || 0);
      const gross = Math.max(sub, tot);

      // Weekday bucket
      const wb = weekdayBuckets[dayIndex];
      wb.orderCount += 1;
      wb.grossSales = round2(wb.grossSales + gross);
      wb.netRevenue = round2(wb.netRevenue + tot);

      // Daily date row
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          dateStr,
          dayIndex,
          shortName: SHORT_DAYS[dayIndex],
          orderCount: 0,
          grossSales: 0,
          netRevenue: 0,
        });
      }
      const dr = dailyMap.get(dateStr)!;
      dr.orderCount += 1;
      dr.grossSales = round2(dr.grossSales + gross);
      dr.netRevenue = round2(dr.netRevenue + tot);

      // Dish aggregation
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const rawTitle = (item.menuItem?.title || item.title || "Unknown Item").trim();
        const category = (item.menuItem?.category || item.category || "Uncategorized").trim();
        const qty = Number(item.quantity || 1);
        const unitPrice = item.isFree
          ? 0
          : item.customItemPrice !== undefined
          ? Number(item.customItemPrice)
          : Number(item.menuItem?.price ?? item.price ?? 0) + Number(item.addonPrice || 0);
        const lineRev = round2(Math.max(0, unitPrice) * qty);

        const key = rawTitle.toUpperCase();
        if (!dishMap.has(key)) {
          dishMap.set(key, {
            title: rawTitle,
            category,
            qtySold: 0,
            revenue: 0,
            weekdayUnits: [0, 0, 0, 0, 0, 0, 0],
          });
        }
        const d = dishMap.get(key)!;
        d.qtySold += qty;
        d.revenue = round2(d.revenue + lineRev);
        d.weekdayUnits[dayIndex] += qty;
        totalUnitsSold += qty;
      }
    }

    // Compute averages & peak day
    let maxNet = 0;
    for (const wb of weekdayBuckets) {
      wb.avgOrderValue = wb.orderCount > 0 ? round2(wb.netRevenue / wb.orderCount) : 0;
      if (wb.netRevenue > maxNet) maxNet = wb.netRevenue;
    }
    if (maxNet > 0) {
      for (const wb of weekdayBuckets) {
        if (wb.netRevenue === maxNet) wb.isPeak = true;
      }
    }

    const dailyRows = Array.from(dailyMap.values())
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
      .map((r) => ({
        ...r,
        avgOrderValue: r.orderCount > 0 ? round2(r.netRevenue / r.orderCount) : 0,
      }));

    const dishes = Array.from(dishMap.values())
      .sort((a, b) => b.qtySold - a.qtySold)
      .map((d) => ({
        ...d,
        sharePct: totalUnitsSold > 0 ? round2((d.qtySold / totalUnitsSold) * 100) : 0,
      }));

    return NextResponse.json({
      meta: { range, startDate, endDate, totalUnitsSold },
      weekdayBreakdown: weekdayBuckets,
      dailyRows,
      dishes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
