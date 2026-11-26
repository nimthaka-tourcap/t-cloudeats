import { NextResponse } from "next/server";
import { getPool, withTransaction } from "@/lib/db";
import { postJournalEntry } from "@/lib/accounting/ledger";
import { round2, todayISO } from "@/lib/accounting/format";

const CATEGORY_TO_ACCOUNT: Record<string, string> = {
  KITCHEN_EQUIPMENT: "1510",
  GAS_INFRASTRUCTURE: "1520",
  POS_IT_HARDWARE: "1530",
  FURNITURE_FIXTURES: "1540",
};

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query(`
      SELECT *,
        (cost - accumulated_depreciation)::numeric(14,2) AS net_book_value
      FROM tce_fixed_assets
      ORDER BY purchase_date DESC, id DESC
    `);
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      asset_category,
      purchase_date,
      cost,
      residual_value = 0,
      useful_life_months,
      supplier,
      invoice_ref,
      funding_account = "1120", // 1120 Bank, 1110 Cash, 2110 AP, 2210 Director Loan
      createdBy = "DIRECTOR",
    } = body;

    const numCost = round2(Number(cost));
    const numResidual = round2(Number(residual_value));
    const lifeMonths = parseInt(useful_life_months, 10);

    if (!name || !asset_category || numCost <= 0 || !lifeMonths || lifeMonths <= 0) {
      return NextResponse.json({ error: "Invalid fixed asset parameters" }, { status: 400 });
    }

    const accountCode = CATEGORY_TO_ACCOUNT[asset_category];
    if (!accountCode) {
      return NextResponse.json({ error: "Invalid asset category" }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      const settingsRes = await client.query(
        `SELECT capex_threshold FROM tce_accounting_settings WHERE id = 'DEFAULT'`
      );
      const threshold = Number(settingsRes.rows[0]?.capex_threshold || 25000);
      if (numCost < threshold) {
        throw new Error(
          `Asset cost LKR ${numCost.toFixed(2)} is below CapEx capitalization threshold (LKR ${threshold.toFixed(2)}). Expense under 6210 Smallwares & Low-Value Utensils instead.`
        );
      }

      const monthlyDep = round2((numCost - numResidual) / lifeMonths);
      const countRes = await client.query(`SELECT COUNT(*) FROM tce_fixed_assets`);
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      const assetId = `FA-${String(nextNum).padStart(4, "0")}`;
      const pDate = purchase_date || todayISO();

      const je = await postJournalEntry(client, {
        entryDate: pDate,
        referenceType: "CAPEX",
        referenceId: assetId,
        description: `CapEx Acquisition: ${name} (${assetId})`,
        createdBy,
        lines: [
          { accountCode, debit: numCost, memo: `Capitalize ${name}` },
          { accountCode: funding_account, credit: numCost, memo: `Payment/Liability for ${name}` },
        ],
      });

      const insertRes = await client.query(
        `INSERT INTO tce_fixed_assets
          (id, name, asset_category, account_code, purchase_date, cost, residual_value, useful_life_months, monthly_depreciation, supplier, invoice_ref, journal_entry_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *, (cost - accumulated_depreciation)::numeric(14,2) AS net_book_value`,
        [
          assetId,
          name,
          asset_category,
          accountCode,
          pDate,
          numCost,
          numResidual,
          lifeMonths,
          monthlyDep,
          supplier || null,
          invoice_ref || null,
          je.id,
        ]
      );

      return { asset: insertRes.rows[0], journalEntryId: je.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, cost, supplier, useful_life_months, status } = body;
    if (!id || !name) {
      return NextResponse.json({ error: "Asset id and name are required" }, { status: 400 });
    }
    const pool = getPool();
    const existing = await pool.query(`SELECT * FROM tce_fixed_assets WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const row = existing.rows[0];
    const nextCost = cost !== undefined ? round2(Number(cost)) : Number(row.cost);
    const life = useful_life_months ? parseInt(useful_life_months, 10) : row.useful_life_months;
    const monthlyDep = round2((nextCost - Number(row.residual_value)) / life);

    const res = await pool.query(
      `UPDATE tce_fixed_assets
       SET name = $1, cost = $2, supplier = $3, useful_life_months = $4, monthly_depreciation = $5, status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *, (cost - accumulated_depreciation)::numeric(14,2) AS net_book_value`,
      [name.trim(), nextCost, supplier || null, life, monthlyDep, status || null, id]
    );
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
