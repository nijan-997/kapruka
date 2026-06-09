export interface DeliveryCheck {
  available: boolean;
  options: Array<{
    type: "express" | "standard" | "scheduled";
    label: string;
    estimatedDate: string;
    price: number;
    available: boolean;
  }>;
}

export async function checkDelivery(
  productId: string,
  address?: { city?: string; district?: string }
): Promise<DeliveryCheck> {
  // TODO: Replace with Kapruka MCP delivery availability check
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() + 5);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return {
    available: true,
    options: [
      {
        type: "express",
        label: "Express Delivery",
        estimatedDate: `Today by 8 PM`,
        price: 750,
        available: today.getHours() < 14,
      },
      {
        type: "standard",
        label: "Standard Delivery",
        estimatedDate: `${fmt(tomorrow)} by 6 PM`,
        price: 350,
        available: true,
      },
      {
        type: "scheduled",
        label: "Scheduled Delivery",
        estimatedDate: `Choose your date`,
        price: 450,
        available: true,
      },
    ],
  };
}
