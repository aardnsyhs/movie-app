import { z } from "zod";

/**
 * Zod schemas for API response validation with safe fallbacks
 */

export const ContentTypeSchema = z.enum(["movie", "tv"]).catch("movie");

export const ContentItemSchema = z.object({
  id: z.string().catch(""),
  title: z.string().catch("Untitled"),
  poster: z.string().catch(""),
  rating: z.number().catch(0),
  year: z.string().catch(""),
  type: ContentTypeSchema,
  genre: z.string().catch(""),
  detailPath: z.string().catch(""),
});

export const EpisodeSchema = z.object({
  id: z.string().catch(""),
  title: z.string().catch(""),
  episodeNumber: z.number().catch(1),
  runtime: z.string().optional(),
  playerUrl: z.string().optional(),
});

export const SeasonSchema = z.object({
  id: z.string().catch(""),
  seasonNumber: z.number().catch(1),
  title: z.string().catch(""),
  episodes: z.array(EpisodeSchema).catch([]),
});

export const ContentDetailSchema = z.object({
  id: z.string().catch(""),
  title: z.string().catch("Untitled"),
  poster: z.string().catch(""),
  backdrop: z.string().optional(),
  rating: z.number().catch(0),
  year: z.string().catch(""),
  type: ContentTypeSchema,
  genre: z.string().catch(""),
  description: z.string().catch(""),
  duration: z.string().optional(),
  playerUrl: z.string().optional(),
  seasons: z.array(SeasonSchema).optional(),
});

export const APIListResponseSchema = z.object({
  success: z.boolean().catch(false),
  items: z.array(ContentItemSchema).catch([]),
  page: z.number().catch(1),
  hasMore: z.boolean().catch(false),
});

export const APIDetailResponseSchema = z.object({
  success: z.boolean().catch(false),
  data: ContentDetailSchema,
});

// Types inferred from schemas
export type ParsedContentItem = z.infer<typeof ContentItemSchema>;
export type ParsedContentDetail = z.infer<typeof ContentDetailSchema>;
export type ParsedAPIListResponse = z.infer<typeof APIListResponseSchema>;
export type ParsedAPIDetailResponse = z.infer<typeof APIDetailResponseSchema>;
