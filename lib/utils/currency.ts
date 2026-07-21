/**
 * Formats a number to Sri Lankan Rupee representation (e.g. 1500 -> "Rs 1,500")
 */
export function formatLKR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "Rs 0";
  }
  return `Rs ${Math.round(amount).toLocaleString("en-US")}`;
}
