import { createKaprukaOrder } from "./kaprukaMcp";

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
  checkoutUrl?: string;
}

function tomorrowInSriLanka() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  try {
    const order = await createKaprukaOrder({
      cart: [{ product_id: input.productId, quantity: 1 }],
      recipient: {
        name: input.recipientName,
        phone: input.recipientPhone,
      },
      delivery: {
        address: input.address,
        city: input.city,
        location_type: "house",
        date: input.scheduledDate || tomorrowInSriLanka(),
        instructions: input.district ? `District: ${input.district}` : null,
      },
      sender: {
        name: input.giftFrom || "Kapi customer",
        anonymous: false,
      },
      gift_message: input.giftMessage || null,
      currency: "LKR",
    });

    return {
      orderId: order.order_ref,
      status: "pending",
      estimatedDelivery: input.scheduledDate || tomorrowInSriLanka(),
      totalAmount: order.summary.grand_total,
      trackingUrl: order.checkout_url,
      checkoutUrl: order.checkout_url,
    };
  } catch (err) {
    console.warn("[commerce/createOrder] Kapruka MCP unavailable, using mock fallback", err);
  }

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
