import {
  APIListResponseSchema,
  APIDetailResponseSchema,
  type ParsedAPIListResponse,
  type ParsedContentDetail,
} from "./schemas";
import type { Category } from "./types";

/**
 * API Configuration
 *
 * PROXY_BASE: Internal proxy route (client-side fetches)
 * DIRECT_API: External API (server-side fetches with caching)
 */
const PROXY_BASE = "/api/proxy";
const DIRECT_API =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://zeldvorik.ru/apiv3/api.php";

/** Player base URL for building embed URLs */
const PLAYER_BASE_URL =
  process.env.NEXT_PUBLIC_PLAYER_BASE_URL || "https://zeldvorik.ru/apiv3";

/** Default timeout for client requests */
const CLIENT_TIMEOUT_MS = 10000;

/** Server cache duration */
const SERVER_CACHE_SECONDS = 300; // 5 minutes

// =============================================================================
// API RESULT TYPE
// =============================================================================

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

// =============================================================================
// SERVER-SIDE FETCHERS (for RSC - use direct API with caching)
// =============================================================================

/**
 * Server-side fetch with caching (for React Server Components)
 * Goes directly to external API with Next.js cache
 */
async function serverFetch<T>(
  url: string,
  parser: (data: unknown) => T,
): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: SERVER_CACHE_SECONDS },
    headers: {
      Accept: "application/json",
      "User-Agent": "NoirFlix/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return parser(data);
}

/**
 * Fetch trending content (server-side, cached)
 */
export async function fetchTrendingServer(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  const url = `${DIRECT_API}?action=trending&page=${page}`;
  return serverFetch(url, (data) => APIListResponseSchema.parse(data));
}

/**
 * Fetch category content (server-side, cached)
 */
export async function fetchCategoryServer(
  category: Category,
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  const url = `${DIRECT_API}?action=${category}&page=${page}`;
  return serverFetch(url, (data) => APIListResponseSchema.parse(data));
}

/**
 * Fetch content detail (server-side, cached)
 */
export async function fetchDetailServer(
  detailPath: string,
): Promise<ApiResult<ParsedContentDetail>> {
  const url = `${DIRECT_API}?action=detail&detailPath=${encodeURIComponent(detailPath)}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: SERVER_CACHE_SECONDS },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `API error: ${response.status}`,
        status: response.status,
      };
    }

    const json = await response.json();
    const parsed = APIDetailResponseSchema.parse(json);

    if (!parsed.success) {
      return { ok: false, error: "Content not found", status: 404 };
    }

    return { ok: true, data: parsed.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

// =============================================================================
// CLIENT-SIDE FETCHERS (use proxy to avoid CORS)
// =============================================================================

/**
 * Fetch with timeout for client-side requests
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = CLIENT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build proxy URL for client-side requests
 */
export function buildProxyUrl(
  action: string,
  params: Record<string, string | number> = {},
): string {
  const url = new URL(PROXY_BASE, window.location.origin);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

/**
 * Build API URL for client-side (uses proxy)
 */
export function buildAPIUrl(category: Category, page: number = 1): string {
  return `${PROXY_BASE}?action=${category}&page=${page}`;
}

/**
 * Build search URL (uses proxy)
 */
export function buildSearchUrl(query: string): string {
  return `${PROXY_BASE}?action=search&q=${encodeURIComponent(query)}`;
}

/**
 * Build detail URL (uses proxy)
 */
export function buildDetailUrl(detailPath: string): string {
  return `${PROXY_BASE}?action=detail&detailPath=${encodeURIComponent(detailPath)}`;
}

// =============================================================================
// SWR FETCHERS (with deduplication config)
// =============================================================================

/**
 * SWR fetcher for list endpoints (uses proxy)
 */
export const swrFetcher = async (
  url: string,
): Promise<ParsedAPIListResponse> => {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  return APIListResponseSchema.parse(data);
};

/**
 * SWR fetcher with timeout (legacy compatibility)
 */
export const swrFetcherWithTimeout = swrFetcher;

/**
 * SWR configuration for optimal deduplication
 */
export const swrConfig = {
  dedupingInterval: 60000, // 1 minute deduplication
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 2,
  errorRetryInterval: 3000,
  keepPreviousData: true,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the player base URL for building embed URLs
 */
export function getPlayerBaseUrl(): string {
  return PLAYER_BASE_URL;
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

/** @deprecated Use fetchCategoryServer for RSC or buildAPIUrl + SWR for client */
export async function fetchCategory(
  category: Category,
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategoryServer(category, page);
}

/** @deprecated Use fetchTrendingServer for RSC */
export async function fetchTrending(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchTrendingServer(page);
}

/** @deprecated Use fetchDetailServer */
export async function fetchDetail(
  detailPath: string,
): Promise<ApiResult<ParsedContentDetail>> {
  return fetchDetailServer(detailPath);
}

/** @deprecated Use fetchCategoryServer */
export async function fetchIndonesianMovies(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategoryServer("indonesian-movies", page);
}

/** @deprecated Use fetchCategoryServer */
export async function fetchIndonesianDrama(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategoryServer("indonesian-drama", page);
}

/** @deprecated Use fetchCategoryServer */
export async function fetchKDrama(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategoryServer("kdrama", page);
}

/** @deprecated Use fetchCategoryServer */
export async function fetchShortTV(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategoryServer("short-tv", page);
}

/** @deprecated Use fetchCategoryServer */
export async function fetchAnime(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategoryServer("anime", page);
}

/** @deprecated Use buildSearchUrl + SWR */
export async function searchContent(
  query: string,
): Promise<ParsedAPIListResponse> {
  const url = `${DIRECT_API}?action=search&q=${encodeURIComponent(query)}`;
  return serverFetch(url, (data) => APIListResponseSchema.parse(data));
}
