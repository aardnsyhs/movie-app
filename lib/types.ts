/**
 * TypeScript type definitions for NoirFlix API
 */

export type ContentType = "movie" | "tv";

export interface ContentItem {
  id: string;
  title: string;
  poster: string;
  rating: number;
  year: string;
  type: ContentType;
  genre: string;
  detailPath: string;
  description?: string;
}

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  runtime?: string;
  playerUrl?: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface ContentDetail {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  rating: number;
  year: string;
  type: ContentType;
  genre: string;
  description: string;
  duration?: string;
  playerUrl?: string;
  seasons?: Season[];
}

export interface APIListResponse {
  success: boolean;
  items: ContentItem[];
  page: number;
  hasMore: boolean;
}

export interface APIDetailResponse {
  success: boolean;
  data: ContentDetail;
}

export type Category =
  | "trending"
  | "indonesian-movies"
  | "indonesian-drama"
  | "kdrama"
  | "short-tv"
  | "anime";

export const CATEGORY_LABELS: Record<Category, string> = {
  trending: "Trending",
  "indonesian-movies": "Film Indonesia",
  "indonesian-drama": "Drama Indonesia",
  kdrama: "K-Drama",
  "short-tv": "Short TV",
  anime: "Anime",
};
