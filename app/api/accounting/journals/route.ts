import { NextResponse } from "next/server";
import { getPool, withTransaction } from "@/lib/db";
import { postJournalEntry } from "@/lib/accounting/ledger";
import { todayISO } from "@/lib/accounting/format";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refType = searchParams.get("referenceType");
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

    const pool = getPool();
    const params: any[] = [];
    let where = "";
    if (refType && refType !== "ALL") {
      params.push(refType);
      where = `WHERE je.reference_type = $1`;
    }
    params.push(limit);

    const res = await pool.query(
      `SELECT
         je.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', jl.id,
               'account_code', jl.account_code,
               'account_name', coa.name,
               'debit', jl.debit,
               'credit', jl.credit,
               'memo', jl.memo
             ) ORDER BY jl.id
           ) FILTER (WHERE jl.id IS NOT NULL),
           '[]'::json
         ) AS lines
       FROM tce_journal_entries je
       LEFT JOIN tce_journal_lines jl ON jl.journal_entry_id = je.id
       LEFT JOIN tce_chart_of_accounts coa ON coa.code = jl.account_code
       ${where}
       GROUP BY je.id
       ORDER BY je.entry_date DESC, je.id DESC
       LIMIT $${params.length}`,
      params
    );
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entryDate, referenceType, referenceId, description, createdBy, lines } = body;

    const result = await withTransaction(async (client) => {
      // Enforce CapEx vs OpEx guard if posting an EXPENSE above threshold to OpEx
      if (referenceType === "EXPENSE" && Array.isArray(lines)) {
        const settingsRes = await client.query(
          `SELECT capex_threshold FROM tce_accounting_settings WHERE id = 'DEFAULT'`
        );
        const threshold = Number(settingsRes.rows[0]?.capex_threshold || 25000);
        for (const l of lines) {
          if (l.accountCode === "6210" && Number(l.debit || 0) >= threshold && !body.confirmSmallwareOverride) {
            throw new Error(
              `Amount LKR ${Number(l.debit).toFixed(2)} meets/exceeds CapEx threshold (LKR ${threshold.toFixed(2)}). Capitalize as Fixed Asset (1510-1540) instead of Smallwares OpEx (6210).`
            );
          }
        }
      }

      return await postJournalEntry(client, {
        entryDate: entryDate || todayISO(),
        referenceType: referenceType || "MANUAL",
        referenceId: referenceId || null,
        description: description || "Manual Journal Entry",
        createdBy: createdBy || "DIRECTOR",
        lines,
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
