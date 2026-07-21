import { STORE_CONFIG } from "../constants/store";
import { formatLKR } from "./currency";

export interface WhatsAppCartItem {
  title: string;
  price: number;
  quantity: number;
}

export function generateWhatsAppOrderUrl(
  items: WhatsAppCartItem[],
  customerName?: string,
  customerAddress?: string,
  notes?: string
): string {
  const lineItemsText = items
    .map((item) => `• ${item.quantity}x ${item.title} - ${formatLKR(item.price * item.quantity)}`)
    .join("\n");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let message = `🛒 *NEW ORDER - T-CLOUD EATS*\n\n${lineItemsText}\n\n*Total Amount:* ${formatLKR(total)}`;

  if (customerName) {
    message += `\n\n👤 *Customer Name:* ${customerName}`;
  }
  if (customerAddress) {
    message += `\n📍 *Delivery Address:* ${customerAddress}`;
  }
  if (notes) {
    message += `\n📝 *Notes:* ${notes}`;
  }

  message += `\n\nThank you for ordering with T-Cloud Eats!`;

  return `https://wa.me/${STORE_CONFIG.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
