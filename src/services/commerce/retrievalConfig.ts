// Configurable retrieval pipeline settings

export const BANNED_KEYWORDS: string[] = [
  "exercise book",
  "activity book",
  "alphabet book",
  "nursery book",
  "school book",
  "textbook",
  "children book",
  "children's book",
  "kids book",
  "exercise",
  "activity",
  "abc",
  "school",
  "nursery",
  "zoo",
  "alphabet",
  "children",
  "kindergarten",
  "workbook",
  "colouring book",
  "coloring book",
  "story book for kids",
];

export const BUDGET_TOLERANCE_RATIO = 0.1;

/** Max AI-generated search queries (3 primary + 2 supporting). */
export const MAX_SEARCH_QUERIES = 5;

/** Parallel MCP search concurrency. */
export const MCP_CONCURRENCY = 5;

/** Stop MCP retrieval once this many unique products are collected. */
export const EARLY_STOP_PRODUCT_COUNT = 25;

/** Products fetched per MCP query. */
export const PRODUCTS_PER_QUERY = 8;

/** Top products kept after deterministic scoring. */
export const TOP_CANDIDATE_LIMIT = 10;

/** Max products sent to AI for explanation generation. */
export const MAX_EXPLANATION_PRODUCTS = 4;

/** Minimum deterministic score to be a candidate. */
export const MIN_DETERMINISTIC_SCORE = 50;
