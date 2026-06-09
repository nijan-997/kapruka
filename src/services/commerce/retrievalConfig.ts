// Configurable retrieval pipeline settings

/** Keywords that indicate obviously irrelevant products (matched against name, category, tags, description). */
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

/** Allow products up to this fraction above budget max (e.g. 0.1 = 10% over). */
export const BUDGET_TOLERANCE_RATIO = 0.1;

/** Minimum relevance score (0-100) for a product to reach ranking. */
export const MIN_RELEVANCE_SCORE = 60;

/** Target number of AI-generated search queries. */
export const QUERY_COUNT_MIN = 8;
export const QUERY_COUNT_MAX = 12;

/** Products fetched per search query from Kapruka. */
export const PRODUCTS_PER_QUERY = 8;

/** Max products sent to AI relevance scoring. */
export const MAX_PRODUCTS_TO_SCORE = 40;

/** Max products sent to final recommendation ranking. */
export const MAX_RANKING_CANDIDATES = 15;
