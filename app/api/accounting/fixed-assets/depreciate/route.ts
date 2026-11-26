import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { postJournalEntry } from "@/lib/accounting/ledger";
import { round2, todayISO } from "@/lib/accounting/format";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const depMonth = body.month || todayISO().slice(0, 7); // YYYY-MM
    const depDate = body.entryDate || `${depMonth}-28`;
    const userId = body.userId || "DIRECTOR";

    const result = await withTransaction(async (client) => {
      const assetsRes = await client.query(
        `SELECT * FROM tce_fixed_assets WHERE status = 'ACTIVE' ORDER BY id`
      );

      let totalDepPosted = 0;
      let assetsDepreciated = 0;
      const lines: { accountCode: string; debit?: number; credit?: number; memo?: string }[] = [];

      for (const asset of assetsRes.rows) {
        const lastDepMonth = asset.last_depreciation_date
          ? new Date(asset.last_depreciation_date).toISOString().slice(0, 7)
          : null;

        if (lastDepMonth === depMonth) continue; // Already depreciated this month

        const remainingDepreciable = round2(
          Number(asset.cost) - Number(asset.residual_value) - Number(asset.accumulated_depreciation)
        );
        if (remainingDepreciable <= 0) continue;

        const depAmount = round2(Math.min(Number(asset.monthly_depreciation), remainingDepreciable));
        if (depAmount <= 0) continue;

        await client.query(
          `UPDATE tce_fixed_assets
           SET accumulated_depreciation = accumulated_depreciation + $1,
               last_depreciation_date = $2
           WHERE id = $3`,
          [depAmount, depDate, asset.id]
        );

        totalDepPosted = round2(totalDepPosted + depAmount);
        assetsDepreciated++;
        lines.push({
          accountCode: asset.accum_dep_account_code || "1590",
          credit: depAmount,
          memo: `Monthly depreciation (${depMonth}): ${asset.name}`,
        });
      }

      if (totalDepPosted === 0) {
        return { message: `No active assets due for depreciation in ${depMonth}.`, assetsDepreciated: 0, totalDepPosted: 0 };
      }

      lines.unshift({
        accountCode: "6300",
        debit: totalDepPosted,
        memo: `Monthly straight-line depreciation for ${depMonth}`,
      });

      const je = await postJournalEntry(client, {
        entryDate: depDate,
        referenceType: "DEPRECIATION",
        referenceId: `DEP-${depMonth}`,
        description: `Monthly PP&E Depreciation Run (${depMonth}) - ${assetsDepreciated} assets`,
        createdBy: userId,
        lines,
      });

      return { assetsDepreciated, totalDepPosted, journalEntryId: je.id };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
