import { PoolClient } from "pg";
import { getSriLankaFiscalYear, round2 } from "./format";

export type JournalReferenceType =
  | "POS_SALE"
  | "PURCHASE"
  | "STOCK_ADJ"
  | "WASTE"
  | "EXPENSE"
  | "CAPEX"
  | "DEPRECIATION"
  | "PAYROLL"
  | "SETTLEMENT"
  | "MANUAL"
  | "REVERSAL";

export interface JournalLineInput {
  accountCode: string;
  debit?: number;
  credit?: number;
  memo?: string;
}

export interface PostJournalInput {
  entryDate: string; // YYYY-MM-DD
  referenceType: JournalReferenceType;
  referenceId?: string | null;
  description: string;
  createdBy: string;
  reversesEntryId?: string | null;
  lines: JournalLineInput[];
}

export async function generateJournalId(
  client: PoolClient,
  entryDate: string
): Promise<string> {
  const datePart = entryDate.replace(/-/g, "");
  const prefix = `JE-${datePart}-`;
  const res = await client.query(
    `SELECT id FROM tce_journal_entries WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let seq = 1;
  if (res.rows.length > 0) {
    const lastId = res.rows[0].id as string;
    const lastSeq = parseInt(lastId.slice(prefix.length), 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Posts an immutable double-entry journal entry.
 * Enforces:
 * - At least 2 lines
 * - Non-negative amounts
 * - Total Debits === Total Credits (to 2 decimal places)
 * - Valid Chart of Accounts codes
 */
export async function postJournalEntry(
  client: PoolClient,
  input: PostJournalInput
): Promise<{ id: string; fiscalYear: string; totalDebit: number; totalCredit: number }> {
  if (!input.lines || input.lines.length < 2) {
    throw new Error("Double-entry journal requires at least 2 lines.");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  const cleanLines = input.lines
    .map((l) => ({
      accountCode: l.accountCode.trim(),
      debit: round2(Number(l.debit || 0)),
      credit: round2(Number(l.credit || 0)),
      memo: l.memo || null,
    }))
    .filter((l) => l.debit > 0 || l.credit > 0);

  if (cleanLines.length < 2) {
    throw new Error("At least 2 non-zero journal lines are required.");
  }

  for (const line of cleanLines) {
    if (line.debit < 0 || line.credit < 0) {
      throw new Error(`Negative amount not allowed on account ${line.accountCode}`);
    }
    if (line.debit > 0 && line.credit > 0) {
      throw new Error(`Line for ${line.accountCode} cannot have both Debit and Credit > 0`);
    }
    totalDebit = round2(totalDebit + line.debit);
    totalCredit = round2(totalCredit + line.credit);
  }

  if (Math.abs(totalDebit - totalCredit) > 0.009) {
    throw new Error(
      `Journal out of balance: Debit (${totalDebit.toFixed(2)}) != Credit (${totalCredit.toFixed(2)})`
    );
  }

  const entryId = await generateJournalId(client, input.entryDate);
  const fiscalYear = getSriLankaFiscalYear(input.entryDate);

  await client.query(
    `INSERT INTO tce_journal_entries
      (id, entry_date, fiscal_year, reference_type, reference_id, description, status, reverses_entry_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'POSTED', $7, $8)`,
    [
      entryId,
      input.entryDate,
      fiscalYear,
      input.referenceType,
      input.referenceId || null,
      input.description,
      input.reversesEntryId || null,
      input.createdBy || "SYSTEM",
    ]
  );

  for (const line of cleanLines) {
    await client.query(
      `INSERT INTO tce_journal_lines (journal_entry_id, account_code, debit, credit, memo)
       VALUES ($1, $2, $3, $4, $5)`,
      [entryId, line.accountCode, line.debit, line.credit, line.memo]
    );
  }

  return { id: entryId, fiscalYear, totalDebit, totalCredit };
}

/**
 * Statutory Audit Compliance: Prohibits hard deletion.
 * Creates a mirror REVERSAL entry and marks the original entry as REVERSED.
 */
export async function reverseJournalEntry(
  client: PoolClient,
  originalId: string,
  reason: string,
  userId: string,
  reversalDate: string
): Promise<{ reversalId: string }> {
  if (!reason || reason.trim().length < 3) {
    throw new Error("A reversal reason code/explanation is required for statutory audit compliance.");
  }

  const origRes = await client.query(
    `SELECT * FROM tce_journal_entries WHERE id = $1 FOR UPDATE`,
    [originalId]
  );
  if (origRes.rows.length === 0) {
    throw new Error(`Journal entry ${originalId} not found.`);
  }
  const orig = origRes.rows[0];
  if (orig.status === "REVERSED") {
    throw new Error(`Journal entry ${originalId} is already reversed by ${orig.reversed_by_id}.`);
  }

  const linesRes = await client.query(
    `SELECT account_code, debit, credit, memo FROM tce_journal_lines WHERE journal_entry_id = $1`,
    [originalId]
  );

  const reversedLines: JournalLineInput[] = linesRes.rows.map((r) => ({
    accountCode: r.account_code,
    debit: Number(r.credit),
    credit: Number(r.debit),
    memo: `Reversal of ${originalId}: ${r.memo || ""}`.trim(),
  }));

  const posted = await postJournalEntry(client, {
    entryDate: reversalDate,
    referenceType: "REVERSAL",
    referenceId: originalId,
    description: `REVERSAL [${originalId}] - ${reason.trim()}`,
    createdBy: userId,
    reversesEntryId: originalId,
    lines: reversedLines,
  });

  await client.query(
    `UPDATE tce_journal_entries
     SET status = 'REVERSED', reversed_by_id = $1, reversal_reason = $2
     WHERE id = $3`,
    [posted.id, reason.trim(), originalId]
  );

  return { reversalId: posted.id };
}
