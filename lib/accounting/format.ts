/**
 * Accounting-grade formatting & Sri Lankan statutory fiscal year helpers.
 * Standard format: Rs. 1,331,500.00 (2 decimal places)
 */

import { formatLKR2, formatLKR } from "@/lib/utils/currency";
export { formatLKR2, formatLKR };

export function round2(value: number): number {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Sri Lankan statutory tax year: April 1 to March 31.
 * e.g., 2026-11-26 -> "FY2026/27", 2027-02-15 -> "FY2026/27"
 */
export function getSriLankaFiscalYear(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1..12
  const startYear = month >= 4 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `FY${startYear}/${endYearShort}`;
}

export function getFiscalYearDateRange(fy: string): { start: string; end: string } {
  const match = fy.match(/^FY(\d{4})\/\d{2}$/);
  if (!match) {
    const now = new Date();
    const curFy = getSriLankaFiscalYear(now);
    return getFiscalYearDateRange(curFy);
  }
  const startYear = parseInt(match[1], 10);
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
  };
}

export function todayISO(): string {
  // Sri Lanka is UTC+05:30
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}
