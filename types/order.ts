import { MenuItem } from "./menu";

export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "COMPLETED";
export type PaymentMethod = "CASH" | "CARD" | "HELAPOS" | "ONLINE" | "WHATSAPP";
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "UBER_EATS" | "PICKME";

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface OrderItem {
  id?: string;
  menuItemId: number;
  title: string;
  price: number;
  quantity: number;
  notes?: string;
  item?: MenuItem;
}

export interface Order {
  id: string;
  orderNumber?: number;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  orderType: OrderType;
  tableNumber?: string;
  created_at: string;
  updated_at?: string;
}
