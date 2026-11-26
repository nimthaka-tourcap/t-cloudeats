import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM tce_accounting_settings WHERE id = 'DEFAULT' LIMIT 1`
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Settings not initialized" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const pool = getPool();
    const res = await pool.query(
      `UPDATE tce_accounting_settings
       SET company_name = COALESCE($1, company_name),
           company_reg_no = COALESCE($2, company_reg_no),
           vat_registered = COALESCE($3, vat_registered),
           vat_rate = COALESCE($4, vat_rate),
           sscl_registered = COALESCE($5, sscl_registered),
           sscl_rate = COALESCE($6, sscl_rate),
           capex_threshold = COALESCE($7, capex_threshold),
           uber_commission_rate = COALESCE($8, uber_commission_rate),
           pickme_commission_rate = COALESCE($9, pickme_commission_rate),
           smallwares_policy = COALESCE($10, smallwares_policy),
           updated_at = NOW()
       WHERE id = 'DEFAULT'
       RETURNING *`,
      [
        body.company_name,
        body.company_reg_no,
        body.vat_registered,
        body.vat_rate,
        body.sscl_registered,
        body.sscl_rate,
        body.capex_threshold,
        body.uber_commission_rate,
        body.pickme_commission_rate,
        body.smallwares_policy,
      ]
    );
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
