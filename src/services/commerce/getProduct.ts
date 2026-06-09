import { MOCK_PRODUCTS } from "./mockData";
import type { ProductInput } from "@/lib/ai/rankRecommendations";

export async function getProduct(id: string): Promise<ProductInput | null> {
  // TODO: Replace with Kapruka MCP client call
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}
