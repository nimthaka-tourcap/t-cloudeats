import { Order, OrderItem } from "./order";

export interface PosCartItem extends OrderItem {
  key: string;
}

export interface PosCartState {
  items: PosCartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface ShiftSummaryData {
  shiftId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  helaposSales: number;
  totalOrdersCount: number;
}

export interface ThermalTicketData {
  order: Order;
  restaurantName: string;
  phone: string;
  address: string;
  printedAt: string;
}
