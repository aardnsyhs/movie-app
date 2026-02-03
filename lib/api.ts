import {
  APIListResponseSchema,
  APIDetailResponseSchema,
  type ParsedAPIListResponse,
  type ParsedContentDetail,
} from "./schemas";
import type { Category } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://zeldvorik.ru/apiv3/api.php";

/** Player base URL for building embed URLs */
const PLAYER_BASE_URL =
  process.env.NEXT_PUBLIC_PLAYER_BASE_URL || "https://zeldvorik.ru/apiv3";

/** Default timeout for API requests (8 seconds) */
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * API Result type for consistent error handling
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

/**
 * Fetch with timeout using AbortController
 * Prevents server/client from waiting indefinitely on slow APIs
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
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
 * Generic fetch wrapper with error handling (for server-side)
 */
async function fetchAPI<T>(
  url: string,
  parser: (data: unknown) => T,
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return parser(data);
}

/**
 * Fetch content list by category
 */
export async function fetchCategory(
  category: Category,
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  const url = `${API_BASE_URL}?action=${category}&page=${page}`;
  return fetchAPI(url, (data) => APIListResponseSchema.parse(data));
}

/**
 * Fetch trending content
 */
export async function fetchTrending(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategory("trending", page);
}

/**
 * Fetch Indonesian movies
 */
export async function fetchIndonesianMovies(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategory("indonesian-movies", page);
}

/**
 * Fetch Indonesian drama
 */
export async function fetchIndonesianDrama(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategory("indonesian-drama", page);
}

/**
 * Fetch K-Drama
 */
export async function fetchKDrama(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategory("kdrama", page);
}

/**
 * Fetch Short TV
 */
export async function fetchShortTV(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategory("short-tv", page);
}

/**
 * Fetch Anime
 */
export async function fetchAnime(
  page: number = 1,
): Promise<ParsedAPIListResponse> {
  return fetchCategory("anime", page);
}

/**
 * Search content
 */
export async function searchContent(
  query: string,
): Promise<ParsedAPIListResponse> {
  const url = `${API_BASE_URL}?action=search&q=${encodeURIComponent(query)}`;
  return fetchAPI(url, (data) => APIListResponseSchema.parse(data));
}

/**
 * Fetch content detail with proper error handling
 */
export async function fetchDetail(
  detailPath: string,
): Promise<ApiResult<ParsedContentDetail>> {
  const url = `${API_BASE_URL}?action=detail&detailPath=${encodeURIComponent(detailPath)}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
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
      return {
        ok: false,
        error: "Content not found",
        status: 404,
      };
    }

    return { ok: true, data: parsed.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

/**
 * Get the player base URL for building embed URLs
 */
export function getPlayerBaseUrl(): string {
  return PLAYER_BASE_URL;
}

/**
 * SWR fetcher for client-side data fetching (no timeout)
 */
export const swrFetcher = async (
  url: string,
): Promise<ParsedAPIListResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  return APIListResponseSchema.parse(data);
};

/**
 * SWR fetcher with timeout for client-side data fetching
 * Includes 8s timeout to prevent long waits on slow APIs
 */
export const swrFetcherWithTimeout = async (
  url: string,
): Promise<ParsedAPIListResponse> => {
  const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  return APIListResponseSchema.parse(data);
};

/**
 * Build API URL for SWR
 */
export function buildAPIUrl(category: Category, page: number = 1): string {
  return `${API_BASE_URL}?action=${category}&page=${page}`;
}

export function buildSearchUrl(query: string): string {
  return `${API_BASE_URL}?action=search&q=${encodeURIComponent(query)}`;
}
