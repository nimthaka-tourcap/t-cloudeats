/**
 * Canonical Sri Lankan Rupee (LKR) currency formatter.
 * - Accounting / Receipts: formatLKR2(1500) -> "Rs. 1,500.00" (negative -> "(Rs. 1,500.00)")
 * - Compact POS Tiles: formatLKR(1500) -> "Rs 1,500" (or pass { decimals: true } for "Rs. 1,500.00")
 */
export function formatLKR2(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return "Rs. 0.00";
  const absFormatted = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(Rs. ${absFormatted})` : `Rs. ${absFormatted}`;
}

export function formatLKR(
  amount: number | string | null | undefined,
  options?: { decimals?: boolean }
): string {
  if (options?.decimals) {
    return formatLKR2(amount);
  }
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return "Rs 0";
  return `Rs ${Math.round(num).toLocaleString("en-US")}`;
}
