import { z } from "zod";

/**
 * Zod schemas for API response validation with safe fallbacks
 */

export const ContentTypeSchema = z.enum(["movie", "tv"]).catch("movie");

/**
 * Normalize rating: API may return string or number
 */
const ratingSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "string") {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  })
  .catch(0);

/**
 * Normalize year: API may return string or number
 */
const yearSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val))
  .catch("");

export const ContentItemSchema = z.object({
  id: z.string().catch(""),
  title: z.string().catch("Untitled"),
  poster: z.string().catch(""),
  rating: ratingSchema,
  year: yearSchema,
  type: ContentTypeSchema,
  genre: z.string().catch(""),
  detailPath: z.string().catch(""),
  description: z.string().optional(), // For hero overview
});

/**
 * Cast member schema
 */
export const CastMemberSchema = z.object({
  name: z.string().catch(""),
  character: z.string().optional(),
  avatar: z.string().optional(),
});

/**
 * Episode schema - maps API field `episode` to `episodeNumber`
 */
export const EpisodeSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().catch(""),
    episode: z.number().optional(),
    episodeNumber: z.number().optional(),
    runtime: z.string().optional(),
    playerUrl: z.string().optional(),
    cover: z.string().optional(),
  })
  .transform((ep) => ({
    id: ep.id || "",
    title: ep.title,
    episodeNumber: ep.episode ?? ep.episodeNumber ?? 1,
    runtime: ep.runtime,
    playerUrl: ep.playerUrl,
    cover: ep.cover,
  }));

/**
 * Season schema - maps API field `season` to `seasonNumber`
 */
export const SeasonSchema = z
  .object({
    id: z.string().optional(),
    season: z.number().optional(),
    seasonNumber: z.number().optional(),
    title: z.string().optional(),
    episodes: z.array(EpisodeSchema).catch([]),
  })
  .transform((s) => ({
    id: s.id || "",
    seasonNumber: s.season ?? s.seasonNumber ?? 1,
    title: s.title || "",
    episodes: s.episodes,
  }));

export const ContentDetailSchema = z.object({
  id: z.string().catch(""),
  title: z.string().catch("Untitled"),
  poster: z.string().catch(""),
  backdrop: z.string().optional(),
  rating: ratingSchema,
  year: yearSchema,
  type: ContentTypeSchema,
  genre: z.string().catch(""),
  description: z.string().catch(""),
  duration: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? String(val) : undefined))
    .optional(),
  playerUrl: z.string().optional(),
  country: z.string().optional(),
  detailPath: z.string().optional(),
  cast: z.array(CastMemberSchema).optional(),
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

// ============ Stream API Schemas ============

/**
 * Download source (MP4 with quality)
 */
export const DownloadSourceSchema = z.object({
  url: z.string(),
  resolution: z.number().optional(),
  quality: z.number().optional(),
});

/**
 * Caption/subtitle
 */
export const CaptionSchema = z.object({
  language: z.string().catch("Unknown"),
  url: z.string(),
  languageCode: z.string().optional(),
});

/**
 * Stream API response
 */
export const StreamResponseSchema = z.object({
  success: z.boolean().catch(false),
  downloads: z.array(DownloadSourceSchema).catch([]),
  captions: z.array(CaptionSchema).catch([]),
});

// Types inferred from schemas
export type ParsedContentItem = z.infer<typeof ContentItemSchema>;
export type ParsedContentDetail = z.infer<typeof ContentDetailSchema>;
export type ParsedAPIListResponse = z.infer<typeof APIListResponseSchema>;
export type ParsedAPIDetailResponse = z.infer<typeof APIDetailResponseSchema>;
export type ParsedEpisode = z.infer<typeof EpisodeSchema>;
export type ParsedSeason = z.infer<typeof SeasonSchema>;
export type ParsedCastMember = z.infer<typeof CastMemberSchema>;
export type ParsedDownloadSource = z.infer<typeof DownloadSourceSchema>;
export type ParsedCaption = z.infer<typeof CaptionSchema>;
export type ParsedStreamResponse = z.infer<typeof StreamResponseSchema>;
