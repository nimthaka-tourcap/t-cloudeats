import { NextResponse } from "next/server";
import { getPool, withTransaction } from "@/lib/db";
import { postJournalEntry } from "@/lib/accounting/ledger";
import { round2, todayISO } from "@/lib/accounting/format";

export async function GET() {
  try {
    const pool = getPool();
    const [settlementsRes, balancesRes] = await Promise.all([
      pool.query(`SELECT * FROM tce_aggregator_settlements ORDER BY settlement_date DESC, id DESC LIMIT 50`),
      pool.query(`
        SELECT
          account_code,
          (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0))::numeric(14,2) AS receivable_balance
        FROM tce_journal_lines
        WHERE account_code IN ('1130', '1131')
        GROUP BY account_code
      `),
    ]);

    const balances: Record<string, number> = { "1130": 0, "1131": 0 };
    for (const row of balancesRes.rows) {
      balances[row.account_code] = Number(row.receivable_balance || 0);
    }

    return NextResponse.json({
      settlements: settlementsRes.rows,
      receivableBalances: {
        uberEats: balances["1130"],
        pickMeFood: balances["1131"],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      platform, // 'UBER_EATS' | 'PICKME'
      settlement_date = todayISO(),
      gross_sales = 0,
      commission_amount = 0,
      net_payout_received,
      bank_account_code = "1120",
      reference_no,
      createdBy = "DIRECTOR",
    } = body;

    const netPayout = round2(Number(net_payout_received));
    if (!platform || netPayout <= 0) {
      return NextResponse.json({ error: "Platform and positive net_payout_received are required" }, { status: 400 });
    }

    const receivableAcc = platform === "PICKME" ? "1131" : "1130";
    const platformLabel = platform === "PICKME" ? "PickMe Food" : "Uber Eats";

    const result = await withTransaction(async (client) => {
      const je = await postJournalEntry(client, {
        entryDate: settlement_date,
        referenceType: "SETTLEMENT",
        referenceId: reference_no || `${platform}-${settlement_date}`,
        description: `${platformLabel} Bank Payout Settlement (${reference_no || settlement_date})`,
        createdBy,
        lines: [
          { accountCode: bank_account_code, debit: netPayout, memo: `${platformLabel} payout received in bank` },
          { accountCode: receivableAcc, credit: netPayout, memo: `Clear ${platformLabel} receivable` },
        ],
      });

      const id = `SET-${Date.now().toString().slice(-8)}`;
      await client.query(
        `INSERT INTO tce_aggregator_settlements
          (id, platform, settlement_date, gross_sales, commission_amount, net_payout_received, bank_account_code, reference_no, journal_entry_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          platform,
          settlement_date,
          round2(Number(gross_sales)),
          round2(Number(commission_amount)),
          netPayout,
          bank_account_code,
          reference_no || null,
          je.id,
          createdBy,
        ]
      );

      return { id, journalEntryId: je.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
