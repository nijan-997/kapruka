import { MOCK_PRODUCTS } from "./mockData";
import { getKaprukaProduct } from "./kaprukaMcp";
import type { ProductInput } from "@/lib/ai/rankRecommendations";

export async function getProduct(id: string): Promise<ProductInput | null> {
  try {
    const product = await getKaprukaProduct(id);
    if (product) return product;
  } catch (err) {
    console.warn("[commerce/getProduct] Kapruka MCP unavailable, using mock fallback", err);
  }

  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}
