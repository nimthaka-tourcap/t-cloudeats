import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { reverseJournalEntry } from "@/lib/accounting/ledger";
import { todayISO } from "@/lib/accounting/format";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { journalEntryId, reason, userId, reversalDate } = body;

    if (!journalEntryId || !reason) {
      return NextResponse.json(
        { error: "journalEntryId and reason are required for audit-compliant reversal." },
        { status: 400 }
      );
    }

    const res = await withTransaction(async (client) => {
      return await reverseJournalEntry(
        client,
        journalEntryId,
        reason,
        userId || "DIRECTOR",
        reversalDate || todayISO()
      );
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
