import type { ProductInput } from "@/lib/ai/rankRecommendations";

const DEFAULT_MCP_URL = "https://mcp.kapruka.com/mcp";
const MCP_PROTOCOL_VERSION = "2024-11-05";

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

interface McpToolResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: { result?: string };
  isError?: boolean;
}

interface KaprukaSearchResponse {
  results: KaprukaSearchProduct[];
  next_cursor: string | null;
  applied_filters: Record<string, unknown>;
}

interface KaprukaSearchProduct {
  id: string;
  name: string;
  summary?: string;
  price?: { amount: number | null; currency: string };
  compare_at_price?: { amount: number; currency: string } | null;
  in_stock?: boolean;
  stock_level?: string;
  image_url?: string | null;
  category?: { id?: string; name?: string; slug?: string; path?: string };
  rating?: number | null;
  ships_internationally?: boolean;
  url?: string;
}

export interface KaprukaSearchOptions {
  queries: string[];
  priceFilter?: { min: number | null; max: number | null };
  categories?: string[];
  limit?: number;
}

export interface KaprukaDeliveryCheck {
  city: string;
  checked_date: string;
  available: boolean;
  rate: number;
  currency: "LKR";
  reason: string | null;
  next_available_date: string | null;
  perishable_warning: string | null;
}

export interface KaprukaOrderResponse {
  checkout_url: string;
  order_ref: string;
  summary: {
    items_total: number;
    delivery_fee: number;
    addons_total: number;
    grand_total: number;
    currency: string;
  };
  expires_at: string;
}

let requestId = 1;

function getMcpUrl() {
  return process.env.KAPRUKA_MCP_URL || DEFAULT_MCP_URL;
}

function parseSseJson<T>(body: string): JsonRpcResponse<T> {
  const data = body
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .filter(Boolean)
    .join("\n");

  if (!data) {
    return JSON.parse(body) as JsonRpcResponse<T>;
  }

  return JSON.parse(data) as JsonRpcResponse<T>;
}

async function postMcp<T>(
  payload: Record<string, unknown>,
  sessionId?: string
): Promise<{ response: JsonRpcResponse<T>; sessionId: string | null }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }

  const res = await fetch(getMcpUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kapruka MCP request failed (${res.status}): ${text.slice(0, 240)}`);
  }

  const response = parseSseJson<T>(text);
  if (response.error) {
    throw new Error(`Kapruka MCP error: ${response.error.message}`);
  }

  return {
    response,
    sessionId: res.headers.get("mcp-session-id") ?? sessionId ?? null,
  };
}

async function initializeMcpSession(): Promise<string> {
  const id = requestId++;
  const { response, sessionId } = await postMcp<{
    protocolVersion: string;
    serverInfo: { name: string; version: string };
  }>({
    jsonrpc: "2.0",
    id,
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "kapi-next-client", version: "0.1.0" },
    },
  });

  if (!response.result || !sessionId) {
    throw new Error("Kapruka MCP did not return a usable session");
  }

  return sessionId;
}

async function callKaprukaTool<T>(
  name: string,
  params: Record<string, unknown>
): Promise<T> {
  const sessionId = await initializeMcpSession();
  const id = requestId++;
  const { response } = await postMcp<McpToolResult>(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name,
        arguments: { params },
      },
    },
    sessionId
  );

  const result = response.result;
  if (!result) {
    throw new Error(`Kapruka MCP returned no result for ${name}`);
  }
  if (result.isError) {
    throw new Error(readToolText(result) || `Kapruka MCP tool failed: ${name}`);
  }

  const text = result.structuredContent?.result ?? readToolText(result);
  if (!text) {
    throw new Error(`Kapruka MCP returned an empty result for ${name}`);
  }
  if (text.startsWith("Error:") || text.startsWith("No products found")) {
    throw new Error(text);
  }

  return JSON.parse(text) as T;
}

function readToolText(result: McpToolResult) {
  return result.content?.find((item) => item.type === "text")?.text ?? "";
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((v) => v?.trim()).filter(Boolean))) as string[];
}

function categoryKeyword(category: string) {
  const normalized = category.toLowerCase().replace(/[_-]/g, " ");
  const map: Record<string, string> = {
    cakes: "cake",
    flowers: "flowers",
    electronics: "electronics",
    fashion: "fashion",
    lifestyle: "gift",
    beauty: "skincare",
    books: "book",
    food: "hamper",
    gifts: "gift",
    home: "home",
  };
  return map[normalized] ?? normalized;
}

function compactSearchTerm(query: string) {
  const usefulWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter(
      (word) =>
        ![
          "for",
          "and",
          "with",
          "under",
          "over",
          "best",
          "gift",
          "gifts",
          "sri",
          "lanka",
          "delivery",
          "birthday",
          "anniversary",
          "mother",
          "father",
          "partner",
          "friend",
        ].includes(word)
    );

  return usefulWords.slice(0, 3).join(" ");
}

function buildQueryCandidates(options: KaprukaSearchOptions) {
  const categoryTerms = (options.categories ?? []).map(categoryKeyword);
  const compactTerms = options.queries.map(compactSearchTerm);

  return unique([
    ...options.queries,
    ...compactTerms,
    ...categoryTerms,
    "gift",
  ]).filter((query) => query.length >= 3);
}

function toProductInput(product: KaprukaSearchProduct): ProductInput | null {
  const price = product.price?.amount;
  if (!product.id || !product.name || price == null || price <= 0) return null;

  const category = product.category?.name ?? product.category?.slug ?? "Kapruka";
  const summary = product.summary ?? "";
  const tags = unique([
    category,
    product.category?.slug,
    ...product.name.split(/\s+/).slice(0, 8),
  ]).map((tag) => tag.toLowerCase());

  return {
    id: product.id,
    name: product.name,
    price,
    currency: product.price?.currency ?? "LKR",
    compareAtPrice: product.compare_at_price?.amount ?? null,
    category,
    tags,
    rating: product.rating ?? undefined,
    reviewCount: undefined,
    availableToday: product.in_stock ?? false,
    availableTomorrow: product.in_stock ?? false,
    inStock: product.in_stock ?? false,
    stockLevel: product.stock_level,
    description: summary,
    summary,
    imageUrl: product.image_url ?? undefined,
    url: product.url,
    shipsInternationally: product.ships_internationally,
    source: "kapruka",
  };
}

export async function searchKaprukaProducts(
  options: KaprukaSearchOptions
): Promise<ProductInput[]> {
  const limit = options.limit ?? 12;
  const queryCandidates = buildQueryCandidates(options);
  const products = new Map<string, ProductInput>();

  for (const q of queryCandidates) {
    if (products.size >= limit) break;

    try {
      const response = await callKaprukaTool<KaprukaSearchResponse>(
        "kapruka_search_products",
        {
          q,
          limit: Math.min(12, Math.max(limit, 6)),
          currency: "LKR",
          min_price: options.priceFilter?.min ?? null,
          max_price: options.priceFilter?.max ?? null,
          in_stock_only: true,
          sort: "relevance",
          include_stubs: false,
          response_format: "json",
        }
      );

      for (const result of response.results ?? []) {
        const product = toProductInput(result);
        if (product && !products.has(product.id)) {
          products.set(product.id, product);
        }
      }
    } catch {
      // Try the next AI-generated query; some valid broad phrases return no MCP results.
    }
  }

  return Array.from(products.values()).slice(0, limit);
}

export async function getKaprukaProduct(productId: string): Promise<ProductInput | null> {
  const product = await callKaprukaTool<KaprukaSearchProduct>("kapruka_get_product", {
    product_id: productId,
    currency: "LKR",
    response_format: "json",
  });
  return toProductInput(product);
}

export async function checkKaprukaDelivery(params: {
  city: string;
  deliveryDate?: string | null;
  productId?: string;
}): Promise<KaprukaDeliveryCheck> {
  return callKaprukaTool<KaprukaDeliveryCheck>("kapruka_check_delivery", {
    city: params.city,
    delivery_date: params.deliveryDate ?? null,
    product_id: params.productId ?? null,
    response_format: "json",
  });
}

export async function createKaprukaOrder(params: Record<string, unknown>) {
  return callKaprukaTool<KaprukaOrderResponse>("kapruka_create_order", {
    ...params,
    response_format: "json",
  });
}
