import {
  APIListResponseSchema,
  APIDetailResponseSchema,
  type ParsedAPIListResponse,
  type ParsedContentDetail,
} from "./schemas";
import type { Category } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://zeldvorik.ru/apiv3/api.php";

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  url: string,
  parser: (data: unknown) => T,
): Promise<T> {
  const response = await fetch(url, {
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
 * Fetch content detail
 */
export async function fetchDetail(
  detailPath: string,
): Promise<ParsedContentDetail | null> {
  const url = `${API_BASE_URL}?action=detail&detailPath=${encodeURIComponent(detailPath)}`;
  try {
    const response = await fetchAPI(url, (data) =>
      APIDetailResponseSchema.parse(data),
    );
    if (!response.success) return null;
    return response.data;
  } catch {
    return null;
  }
}

/**
 * SWR fetcher for client-side data fetching
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
 * Build API URL for SWR
 */
export function buildAPIUrl(category: Category, page: number = 1): string {
  return `${API_BASE_URL}?action=${category}&page=${page}`;
}

export function buildSearchUrl(query: string): string {
  return `${API_BASE_URL}?action=search&q=${encodeURIComponent(query)}`;
}
