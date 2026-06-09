export interface OrderInput {
  productId: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  district: string;
  deliveryType: "express" | "standard" | "scheduled";
  scheduledDate?: string;
  giftMessage?: string;
  giftFrom?: string;
  paymentMethod: "card" | "koko" | "cod";
}

export interface OrderResult {
  orderId: string;
  status: "confirmed" | "pending" | "failed";
  estimatedDelivery: string;
  totalAmount: number;
  trackingUrl: string;
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  // TODO: Replace with Kapruka MCP createOrder call
  const orderId = `KAP-${Date.now().toString(36).toUpperCase()}`;
  return {
    orderId,
    status: "confirmed",
    estimatedDelivery: "Tomorrow by 6 PM",
    totalAmount: 4850,
    trackingUrl: `/track/${orderId}`,
  };
}

export async function trackOrder(orderId: string) {
  // TODO: Replace with Kapruka MCP trackOrder call
  return {
    orderId,
    status: "out_for_delivery",
    steps: [
      { label: "Order Confirmed", done: true, time: "9:00 AM" },
      { label: "Preparing", done: true, time: "10:30 AM" },
      { label: "Out for Delivery", done: true, time: "2:00 PM" },
      { label: "Delivered", done: false, time: "By 6 PM" },
    ],
  };
}
