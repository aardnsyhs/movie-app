"use client";

import { useState, useCallback, Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Star,
  Play,
  Plus,
  ArrowLeft,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatRating } from "@/lib/utils";
import { VideoPlayer, CastSection } from "@/components";
import { BackdropImage, PosterImage } from "@/components/content/PosterImage";
import { EpisodePlayer } from "./EpisodePlayer";
import type {
  ParsedContentDetail,
  ParsedAPIDetailResponse,
} from "@/lib/schemas";

interface DetailPageClientProps {
  detailPath: string;
}

/**
 * SWR fetcher for detail API route
 */
async function detailFetcher(url: string): Promise<ParsedAPIDetailResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s client timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to load: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw error;
  }
}

/**
 * Split genre string into array of badges
 */
function GenreBadges({ genre }: { genre: string }) {
  if (!genre) return null;

  const genres = genre
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => (
        <span
          key={g}
          className="px-2 py-1 text-xs rounded-full bg-[var(--surface-secondary)] text-[var(--foreground-muted)]"
        >
          {g}
        </span>
      ))}
    </div>
  );
}

/**
 * Expandable description component
 */
function ExpandableDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const shouldTruncate = description.length > 300;
  const displayText =
    !shouldTruncate || isExpanded
      ? description
      : description.slice(0, 300) + "...";

  return (
    <div>
      <p className="text-[var(--foreground-muted)] leading-relaxed">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline mt-2"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Read More</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  error,
  detailPath,
  onRetry,
}: {
  error: string;
  detailPath: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center container-main">
      <AlertCircle className="w-16 h-16 text-[var(--accent-primary)] mb-4" />
      <h1 className="text-2xl font-bold mb-2">Failed to Load Content</h1>
      <p className="text-[var(--foreground-muted)] mb-6 text-center max-w-md">
        {error}
      </p>
      <div className="flex gap-4">
        <Link href="/" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <button onClick={onRetry} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function DetailSkeleton() {
  return (
    <div className="-mt-16">
      <section className="relative min-h-[70vh] flex items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-secondary)] to-[var(--background)]" />

        <div className="relative container-main pb-12 pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
              <div className="aspect-[2/3] rounded-lg skeleton" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="h-6 w-20 skeleton rounded-full mb-3 mx-auto md:mx-0" />
              <div className="h-12 w-3/4 skeleton rounded mb-4 mx-auto md:mx-0" />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                <div className="h-6 w-16 skeleton rounded" />
                <div className="h-6 w-20 skeleton rounded" />
                <div className="h-6 w-24 skeleton rounded" />
              </div>
              <div className="flex justify-center md:justify-start gap-2 mb-6">
                <div className="h-6 w-16 skeleton rounded-full" />
                <div className="h-6 w-20 skeleton rounded-full" />
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
                <div className="h-4 w-4/6 skeleton rounded" />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="h-12 w-32 skeleton rounded-lg" />
                <div className="h-12 w-32 skeleton rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main py-8">
        <div className="h-8 w-24 skeleton rounded mb-4" />
        <div className="aspect-video skeleton rounded-lg" />
      </section>
    </div>
  );
}

/**
 * Detail content renderer (after data is loaded)
 */
function DetailContent({
  detail,
  detailPath,
}: {
  detail: ParsedContentDetail;
  detailPath: string;
}) {
  const backdropImage = detail.backdrop || detail.poster;
  const hasSeasons =
    detail.type === "tv" && detail.seasons && detail.seasons.length > 0;

  return (
    <div className="-mt-16">
      {/* Hero Background */}
      <section className="relative min-h-[70vh] flex items-end">
        {/* Background Image */}
        {backdropImage && (
          <div className="absolute inset-0">
            <BackdropImage
              src={backdropImage}
              alt=""
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/30 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="relative container-main pb-12 pt-32">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
              {detail.poster ? (
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                  <PosterImage
                    src={detail.poster}
                    alt={detail.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="aspect-[2/3] rounded-lg bg-[var(--surface-primary)] flex items-center justify-center">
                  <Play className="w-16 h-16 text-[var(--foreground-subtle)]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Type Badge */}
              <span className="badge badge-accent mb-3 uppercase text-xs tracking-wider">
                {detail.type === "tv" ? "TV Series" : "Movie"}
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {detail.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 text-sm">
                {detail.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
                    <span className="font-semibold">
                      {formatRating(detail.rating)}
                    </span>
                  </div>
                )}
                {detail.year && (
                  <div className="flex items-center gap-1 text-[var(--foreground-muted)]">
                    <Calendar className="w-4 h-4" />
                    <span>{detail.year}</span>
                  </div>
                )}
                {detail.duration && (
                  <div className="flex items-center gap-1 text-[var(--foreground-muted)]">
                    <Clock className="w-4 h-4" />
                    <span>{detail.duration}</span>
                  </div>
                )}
                {detail.country && (
                  <span className="text-[var(--foreground-muted)]">
                    {detail.country}
                  </span>
                )}
              </div>

              {/* Genre Badges */}
              <div className="flex justify-center md:justify-start mb-6">
                <GenreBadges genre={detail.genre} />
              </div>

              {/* Description */}
              <ExpandableDescription description={detail.description} />

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                <a href="#player" className="btn-primary">
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </a>
                <button className="btn-secondary">
                  <Plus className="w-5 h-5" />
                  Add to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast Section */}
      {detail.cast && detail.cast.length > 0 && (
        <div className="container-main">
          <CastSection cast={detail.cast} />
        </div>
      )}

      {/* Video Player & Episodes Section */}
      {hasSeasons ? (
        <Suspense
          fallback={
            <div className="container-main py-8">
              <div className="aspect-video skeleton rounded-lg" />
            </div>
          }
        >
          <EpisodePlayer
            contentId={detail.id}
            detailPath={detailPath}
            seasons={detail.seasons!}
            initialPlayerUrl={detail.playerUrl}
            title={detail.title}
          />
        </Suspense>
      ) : (
        <section id="player" className="container-main py-8">
          <h2 className="text-xl font-semibold mb-4">Watch</h2>
          <VideoPlayer title={detail.title} embedSrc={detail.playerUrl} />
        </section>
      )}
    </div>
  );
}

/**
 * Main Detail Page Client Component
 *
 * Fetches data via SWR from /api/detail route handler
 * - No SSR blocking
 * - Client-side caching
 * - Error retry with exponential backoff
 */
export function DetailPageClient({ detailPath }: DetailPageClientProps) {
  const apiUrl = `/api/detail?detailPath=${encodeURIComponent(detailPath)}`;

  const { data, error, isLoading, mutate } = useSWR<ParsedAPIDetailResponse>(
    apiUrl,
    detailFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      dedupingInterval: 60000, // 1 minute deduplication
    },
  );

  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Loading state
  if (isLoading) {
    return <DetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        error={error.message || "Failed to load content"}
        detailPath={detailPath}
        onRetry={handleRetry}
      />
    );
  }

  // Not found state
  if (!data?.success || !data?.data) {
    return (
      <ErrorState
        error="Content not found"
        detailPath={detailPath}
        onRetry={handleRetry}
      />
    );
  }

  // Success - render detail content
  return <DetailContent detail={data.data} detailPath={detailPath} />;
}

// Keep old export for backwards compatibility if needed elsewhere
export { ExpandableDescription as DetailClient };
