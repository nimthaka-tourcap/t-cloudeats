import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { round2, todayISO, getSriLankaFiscalYear, getFiscalYearDateRange } from "@/lib/accounting/format";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = todayISO();
    const dailyDate = searchParams.get("dailyDate") || today;
    const periodType = searchParams.get("period") || "MONTH"; // MONTH | QUARTER | FY | CUSTOM
    const fiscalYear = searchParams.get("fy") || getSriLankaFiscalYear(today);

    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      if (periodType === "FY") {
        const range = getFiscalYearDateRange(fiscalYear);
        startDate = range.start;
        endDate = range.end;
      } else if (periodType === "QUARTER") {
        const d = new Date(today);
        const qStartMonth = Math.floor(d.getUTCMonth() / 3) * 3;
        const qStart = new Date(Date.UTC(d.getUTCFullYear(), qStartMonth, 1));
        const qEnd = new Date(Date.UTC(d.getUTCFullYear(), qStartMonth + 3, 0));
        startDate = qStart.toISOString().slice(0, 10);
        endDate = qEnd.toISOString().slice(0, 10);
      } else {
        // MONTH
        startDate = `${today.slice(0, 7)}-01`;
        endDate = today;
      }
    }

    const pool = getPool();

    // 1. Daily POS Summary (from live tce_orders for real-time visibility + posted COGS)
    const dailyOrdersRes = await pool.query(
      `SELECT id, subtotal, total, status, type, customer
       FROM tce_orders
       WHERE (timestamp AT TIME ZONE 'Asia/Colombo')::date = $1::date
         AND LOWER(COALESCE(status, '')) NOT IN ('voided', 'cancelled')`,
      [dailyDate]
    );

    let dailyGrossSales = 0;
    let dailyNetSales = 0;
    let dailyAggCommissions = 0;
    let dailyCashSplit = 0;
    let dailyBankCardSplit = 0;
    let dailyAggregatorSplit = 0;

    for (const o of dailyOrdersRes.rows) {
      const sub = Number(o.subtotal || 0);
      const tot = Number(o.total || 0);
      const cust = o.customer || {};
      const oType = (o.type || "").toUpperCase();
      const pm = (cust.payment_method || "").toUpperCase();
      const cName = (cust.name || "").toUpperCase();

      const isThirdParty =
        oType === "3RD PARTY" ||
        oType === "UBER_EATS" ||
        oType === "PICKME" ||
        cName.includes("UBER") ||
        cName.includes("PICKME");

      if (isThirdParty) {
        const gross = sub > 0 ? sub : tot;
        const comm = Math.max(0, gross - tot);
        dailyGrossSales = round2(dailyGrossSales + gross);
        dailyNetSales = round2(dailyNetSales + tot);
        dailyAggCommissions = round2(dailyAggCommissions + comm);
        dailyAggregatorSplit = round2(dailyAggregatorSplit + tot);
      } else {
        const gross = Math.max(sub, tot);
        dailyGrossSales = round2(dailyGrossSales + gross);
        dailyNetSales = round2(dailyNetSales + tot);
        if (
          pm.includes("CARD") ||
          pm.includes("HELAPOS") ||
          pm.includes("BANK") ||
          pm.includes("ONLINE") ||
          pm.includes("PICKME PAY")
        ) {
          dailyBankCardSplit = round2(dailyBankCardSplit + tot);
        } else {
          dailyCashSplit = round2(dailyCashSplit + tot);
        }
      }
    }

    const dailyCogsRes = await pool.query(
      `SELECT COALESCE(SUM(jl.debit - jl.credit), 0)::numeric(14,2) AS cogs
       FROM tce_journal_lines jl
       JOIN tce_journal_entries je ON je.id = jl.journal_entry_id
       WHERE je.entry_date = $1::date AND jl.account_code IN ('5110', '5120')`,
      [dailyDate]
    );
    const dailyTheoreticalCogs = Number(dailyCogsRes.rows[0]?.cogs || 0);
    const dailyFoodCostPct =
      dailyGrossSales > 0 ? round2((dailyTheoreticalCogs / dailyGrossSales) * 100) : 0;
    const dailyGrossMarginPct =
      dailyNetSales > 0
        ? round2(((dailyNetSales - dailyTheoreticalCogs) / dailyNetSales) * 100)
        : 0;

    // 2. P&L (Income Statement) for startDate .. endDate
    const pnlRes = await pool.query(
      `SELECT
         c.code, c.name, c.account_type, c.sub_type, c.normal_balance,
         COALESCE(SUM(jl.debit), 0)::numeric(14,2) AS sum_debit,
         COALESCE(SUM(jl.credit), 0)::numeric(14,2) AS sum_credit
       FROM tce_chart_of_accounts c
       LEFT JOIN tce_journal_lines jl ON jl.account_code = c.code
       LEFT JOIN tce_journal_entries je ON je.id = jl.journal_entry_id
         AND je.entry_date >= $1::date AND je.entry_date <= $2::date
       WHERE c.account_type IN ('REVENUE', 'COGS', 'OPEX')
       GROUP BY c.code
       ORDER BY c.code`,
      [startDate, endDate]
    );

    const revenueItems: any[] = [];
    const cogsItems: any[] = [];
    const opexItems: any[] = [];
    let totalRevenue = 0;
    let totalContraRevenue = 0;
    let totalCogs = 0;
    let totalOpexExclDep = 0;
    let totalDepreciation = 0;

    for (const row of pnlRes.rows) {
      const deb = Number(row.sum_debit || 0);
      const cred = Number(row.sum_credit || 0);
      if (row.account_type === "REVENUE") {
        if (row.sub_type === "CONTRA_REVENUE") {
          const amt = round2(deb - cred);
          if (amt !== 0) revenueItems.push({ code: row.code, name: row.name, amount: -amt, isContra: true });
          totalContraRevenue = round2(totalContraRevenue + amt);
        } else {
          const amt = round2(cred - deb);
          if (amt !== 0) revenueItems.push({ code: row.code, name: row.name, amount: amt, isContra: false });
          totalRevenue = round2(totalRevenue + amt);
        }
      } else if (row.account_type === "COGS") {
        const amt = round2(deb - cred);
        if (amt !== 0) cogsItems.push({ code: row.code, name: row.name, amount: amt });
        totalCogs = round2(totalCogs + amt);
      } else if (row.account_type === "OPEX") {
        const amt = round2(deb - cred);
        if (row.code === "6300" || row.sub_type === "DEPRECIATION") {
          totalDepreciation = round2(totalDepreciation + amt);
        } else {
          if (amt !== 0) opexItems.push({ code: row.code, name: row.name, amount: amt });
          totalOpexExclDep = round2(totalOpexExclDep + amt);
        }
      }
    }

    const netRevenue = round2(totalRevenue - totalContraRevenue);
    const grossProfit = round2(netRevenue - totalCogs);
    const ebitda = round2(grossProfit - totalOpexExclDep);
    const netProfitBeforeTax = round2(ebitda - totalDepreciation);

    // 3. Trial Balance & Balance Sheet (cumulative up to endDate)
    const tbRes = await pool.query(
      `SELECT
         c.code, c.name, c.account_type, c.sub_type, c.normal_balance,
         COALESCE(SUM(jl.debit), 0)::numeric(14,2) AS total_debit,
         COALESCE(SUM(jl.credit), 0)::numeric(14,2) AS total_credit
       FROM tce_chart_of_accounts c
       LEFT JOIN tce_journal_lines jl ON jl.account_code = c.code
       LEFT JOIN tce_journal_entries je ON je.id = jl.journal_entry_id
         AND je.entry_date <= $1::date
       GROUP BY c.code
       ORDER BY c.code`,
      [endDate]
    );

    let tbTotalDebit = 0;
    let tbTotalCredit = 0;
    const trialBalance: any[] = [];

    const nonCurrentAssets: any[] = [];
    const currentAssets: any[] = [];
    const equityItems: any[] = [];
    const nonCurrentLiabilities: any[] = [];
    const currentLiabilities: any[] = [];

    let cumulativeRetainedProfit = 0;

    for (const row of tbRes.rows) {
      const deb = Number(row.total_debit || 0);
      const cred = Number(row.total_credit || 0);
      tbTotalDebit = round2(tbTotalDebit + deb);
      tbTotalCredit = round2(tbTotalCredit + cred);

      const net =
        row.normal_balance === "DEBIT" ? round2(deb - cred) : round2(cred - deb);

      if (deb !== 0 || cred !== 0) {
        trialBalance.push({
          code: row.code,
          name: row.name,
          account_type: row.account_type,
          normal_balance: row.normal_balance,
          debit: deb,
          credit: cred,
          net_balance: net,
        });
      }

      if (row.account_type === "ASSET") {
        if (row.sub_type === "PPE") {
          if (net !== 0) nonCurrentAssets.push({ code: row.code, name: row.name, amount: net });
        } else if (row.sub_type === "ACCUMULATED_DEPRECIATION") {
          if (net !== 0) nonCurrentAssets.push({ code: row.code, name: row.name, amount: -net });
        } else {
          if (net !== 0) currentAssets.push({ code: row.code, name: row.name, amount: net });
        }
      } else if (row.account_type === "LIABILITY") {
        if (row.sub_type === "NON_CURRENT_LIABILITY") {
          if (net !== 0) nonCurrentLiabilities.push({ code: row.code, name: row.name, amount: net });
        } else {
          if (net !== 0) currentLiabilities.push({ code: row.code, name: row.name, amount: net });
        }
      } else if (row.account_type === "EQUITY") {
        if (net !== 0) equityItems.push({ code: row.code, name: row.name, amount: net });
      } else if (row.account_type === "REVENUE") {
        cumulativeRetainedProfit = round2(cumulativeRetainedProfit + (cred - deb));
      } else if (row.account_type === "COGS" || row.account_type === "OPEX") {
        cumulativeRetainedProfit = round2(cumulativeRetainedProfit - (deb - cred));
      }
    }

    if (cumulativeRetainedProfit !== 0) {
      equityItems.push({
        code: "3299",
        name: "Current Period Surplus / (Deficit)",
        amount: cumulativeRetainedProfit,
      });
    }

    const totalNonCurrentAssets = round2(nonCurrentAssets.reduce((s, x) => s + x.amount, 0));
    const totalCurrentAssets = round2(currentAssets.reduce((s, x) => s + x.amount, 0));
    const totalAssets = round2(totalNonCurrentAssets + totalCurrentAssets);

    const totalEquity = round2(equityItems.reduce((s, x) => s + x.amount, 0));
    const totalNonCurrentLiab = round2(nonCurrentLiabilities.reduce((s, x) => s + x.amount, 0));
    const totalCurrentLiab = round2(currentLiabilities.reduce((s, x) => s + x.amount, 0));
    const totalEquityAndLiabilities = round2(totalEquity + totalNonCurrentLiab + totalCurrentLiab);

    // 4. Fixed Asset Register
    const faRes = await pool.query(`
      SELECT *, (cost - accumulated_depreciation)::numeric(14,2) AS net_book_value
      FROM tce_fixed_assets
      ORDER BY purchase_date DESC, id DESC
    `);

    return NextResponse.json({
      meta: {
        dailyDate,
        startDate,
        endDate,
        fiscalYear,
        periodType,
      },
      dailyPosSummary: {
        orderCount: dailyOrdersRes.rows.length,
        grossSales: dailyGrossSales,
        netSales: dailyNetSales,
        aggregatorCommissions: dailyAggCommissions,
        theoreticalCogs: dailyTheoreticalCogs,
        foodCostPct: dailyFoodCostPct,
        grossMarginPct: dailyGrossMarginPct,
        splits: {
          cash: dailyCashSplit,
          bankCard: dailyBankCardSplit,
          aggregator: dailyAggregatorSplit,
        },
      },
      pnl: {
        revenueItems,
        totalGrossRevenue: totalRevenue,
        totalContraRevenue,
        netRevenue,
        cogsItems,
        totalCogs,
        grossProfit,
        opexItems,
        totalOpexExclDep,
        ebitda,
        totalDepreciation,
        netProfitBeforeTax,
      },
      trialBalance: {
        rows: trialBalance,
        totalDebits: tbTotalDebit,
        totalCredits: tbTotalCredit,
        isBalanced: Math.abs(tbTotalDebit - tbTotalCredit) < 0.01,
        variance: round2(tbTotalDebit - tbTotalCredit),
      },
      balanceSheet: {
        nonCurrentAssets,
        totalNonCurrentAssets,
        currentAssets,
        totalCurrentAssets,
        totalAssets,
        equityItems,
        totalEquity,
        nonCurrentLiabilities,
        totalNonCurrentLiab,
        currentLiabilities,
        totalCurrentLiab,
        totalEquityAndLiabilities,
        isBalanced: Math.abs(totalAssets - totalEquityAndLiabilities) < 0.01,
      },
      fixedAssets: faRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
