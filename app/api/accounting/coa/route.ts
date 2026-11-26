import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query(`
      SELECT
        c.*,
        COALESCE(SUM(l.debit), 0)::numeric(14,2) AS total_debit,
        COALESCE(SUM(l.credit), 0)::numeric(14,2) AS total_credit,
        CASE
          WHEN c.normal_balance = 'DEBIT'
            THEN (COALESCE(SUM(l.debit), 0) - COALESCE(SUM(l.credit), 0))::numeric(14,2)
          ELSE (COALESCE(SUM(l.credit), 0) - COALESCE(SUM(l.debit), 0))::numeric(14,2)
        END AS net_balance
      FROM tce_chart_of_accounts c
      LEFT JOIN tce_journal_lines l ON l.account_code = c.code
      GROUP BY c.code
      ORDER BY c.code ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, account_type, normal_balance, parent_code, sub_type, description } = body;

    if (!code || !/^\d{4,5}$/.test(code)) {
      return NextResponse.json({ error: "Account code must be 4 or 5 digits" }, { status: 400 });
    }
    if (!name || !account_type || !normal_balance) {
      return NextResponse.json({ error: "Missing required CoA fields" }, { status: 400 });
    }

    const pool = getPool();
    const res = await pool.query(
      `INSERT INTO tce_chart_of_accounts
        (code, name, account_type, normal_balance, parent_code, sub_type, is_system, is_active, description)
       VALUES ($1, $2, $3, $4, $5, $6, false, true, $7)
       RETURNING *`,
      [code, name, account_type, normal_balance, parent_code || null, sub_type || account_type, description || ""]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
