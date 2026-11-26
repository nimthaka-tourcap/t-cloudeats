export interface CashierMenuItem {
  id: number;
  title: string;
  price: number;
  category: string;
  portion: string;
  image?: string;
  sku?: string;
  available?: boolean;
  description?: string;
}

export interface CashierCartItem {
  menuItem: CashierMenuItem;
  quantity: number;
  isNew?: boolean;
  comment?: string;
  addonPrice?: number;
  isFree?: boolean;
  customItemPrice?: number;
}

export interface ParkedOrder {
  id: string;
  label: string;
  parkedAt: string;
  cart: CashierCartItem[];
  orderType: "POS" | "Direct" | "3rd Party" | "Dine In";
  discountType: "percentage" | "fixed";
  discountValue: number;
  customerName?: string;
  customerPhone?: string;
}

export interface CashierCustomerDetails {
  phone: string;
  name: string;
  address: string;
  payment_method?: string;
  payment_receipt?: string;
  payment_receipt_filename?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  discount_amount?: number;
  delivery_fee?: number;
  payment_status?: "Paid" | "Not Paid" | string;
}

export interface CashierOrder {
  id: string;
  timestamp: string;
  items: CashierCartItem[];
  subtotal: number;
  tax: number;
  delivery_fee?: number;
  total: number;
  status: "Preparing" | "Ready" | "Dispatched" | "Completed" | "Voided" | "Ignored";
  type: "POS" | "Direct" | "3rd Party" | "Take Away" | "Pick Up" | "Delivery" | "Dine In";
  payment_status?: "Paid" | "Not Paid" | string;
  customer?: CashierCustomerDetails;
  syncedToDb?: boolean;
}

export interface CashierInventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  parLevel: number;
  quantity: number;
  unitCost: number;
  supplier: string;
  expirationDate: string;
  storageLocation: "Cooler" | "Freezer" | "Dry Shelf";
}

export function getItemUnitPrice(item: CashierCartItem): number {
  if (item.isFree) return 0;
  const basePrice =
    item.customItemPrice !== undefined
      ? item.customItemPrice
      : item.menuItem
      ? item.menuItem.price
      : (item as any).price || 0;
  return Math.max(0, basePrice + (item.addonPrice || 0));
}

/**
 * 1:00 AM Business Day Cutoff: 00:00–00:59 counts as previous night's shift.
 */
export function getBusinessDateStr(dateInput: Date | string = new Date()): string {
  const d = new Date(dateInput);
  const dateCopy = new Date(d);
  if (d.getHours() < 1) {
    dateCopy.setDate(dateCopy.getDate() - 1);
  }
  const yy = String(dateCopy.getFullYear()).slice(-2);
  const mm = String(dateCopy.getMonth() + 1).padStart(2, "0");
  const dd = String(dateCopy.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/**
 * Generates INV-YYMMDD-XXX; reuses highest sequence if that order was Voided.
 */
export function getNextInvoiceNumber(history: CashierOrder[]): string {
  const currentBizDateStr = getBusinessDateStr(new Date());
  const todaysOrders = history.filter(
    (o) =>
      getBusinessDateStr(o.timestamp) === currentBizDateStr &&
      o.status !== "Ignored" &&
      o.id.startsWith("INV-")
  );

  if (todaysOrders.length === 0) {
    return `INV-${currentBizDateStr}-001`;
  }

  let maxSeq = 0;
  let maxSeqOrder: CashierOrder | null = null;

  todaysOrders.forEach((o) => {
    const parts = o.id.split("-");
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (seq > maxSeq) {
        maxSeq = seq;
        maxSeqOrder = o;
      }
    }
  });

  if (maxSeqOrder && (maxSeqOrder as CashierOrder).status === "Voided") {
    return `INV-${currentBizDateStr}-${String(maxSeq).padStart(3, "0")}`;
  }

  return `INV-${currentBizDateStr}-${String(maxSeq + 1).padStart(3, "0")}`;
}

export function getBillHash(invoiceId: string): string {
  let hash = 0;
  for (let i = 0; i < invoiceId.length; i++) {
    hash = (hash << 5) - hash + invoiceId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 4096).toString(16).padStart(3, "0");
}

export function getBillUrl(invoiceId: string): string {
  return `https://t-cloudeats.com/bills/${invoiceId}${getBillHash(invoiceId)}`;
}
