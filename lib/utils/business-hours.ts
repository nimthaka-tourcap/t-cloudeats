import { STORE_CONFIG } from "@/lib/constants/store";

export interface StoreStatus {
  isOpen: boolean;
  statusText: string;
  helperText: string;
  badgeColorClass: string;
  dotColorClass: string;
}

/**
 * Returns current date/time converted to Sri Lanka timezone (Asia/Colombo, UTC+5:30)
 */
export function getSriLankaDate(): Date {
  const now = new Date();
  const colomboString = now.toLocaleString("en-US", { timeZone: "Asia/Colombo" });
  return new Date(colomboString);
}

/**
 * Checks whether the kitchen is open based on business hours.
 * Kitchen operates between 11:00 AM and 12:00 AM (midnight).
 * After 12:00 AM (00:00 - 10:59), the shop is closed.
 */
export function getStoreStatus(): StoreStatus {
  const lkDate = getSriLankaDate();
  const hours = lkDate.getHours(); // 0 to 23
  
  // Open from 11:00 AM (hours >= 11) until 12:00 AM (23:59:59)
  // From 00:00 (12:00 AM) to 10:59 AM, kitchen is closed
  const isOpen = hours >= 11;

  if (isOpen) {
    return {
      isOpen: true,
      statusText: "Kitchen Open",
      helperText: "~20 Min Prep",
      badgeColorClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dotColorClass: "bg-emerald-500",
    };
  }

  return {
    isOpen: false,
    statusText: "Kitchen Closed",
    helperText: "Opens at 11:00 AM",
    badgeColorClass: "bg-rose-50 border-rose-200 text-rose-700",
    dotColorClass: "bg-rose-500",
  };
}
