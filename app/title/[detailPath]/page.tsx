import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Play,
  Plus,
  ArrowLeft,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { fetchDetail } from "@/lib/api";
import { formatRating, truncateText } from "@/lib/utils";
import { VideoPlayer } from "@/components";
import { DetailClient } from "./DetailClient";
import { EpisodePlayer } from "./EpisodePlayer";

interface DetailPageProps {
  params: Promise<{ detailPath: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const detailPath = resolvedParams.detailPath;
  const result = await fetchDetail(detailPath);

  if (!result.ok) {
    return {
      title: "Not Found",
    };
  }

  const detail = result.data;
  const description = detail.description
    ? truncateText(detail.description, 160)
    : `Watch ${detail.title} on NoirFlix`;

  return {
    title: `${detail.title} (${detail.year || "N/A"})`,
    description,
    openGraph: {
      title: `${detail.title} (${detail.year || "N/A"})`,
      description,
      images: detail.poster ? [{ url: detail.poster }] : undefined,
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: `${detail.title} (${detail.year || "N/A"})`,
      description,
      images: detail.poster ? [detail.poster] : undefined,
    },
  };
}

/**
 * Error state component for network/parse failures
 */
function ErrorState({
  error,
  detailPath,
}: {
  error: string;
  detailPath: string;
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
        <Link href={`/title/${detailPath}`} className="btn-primary">
          Try Again
        </Link>
      </div>
    </div>
  );
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

export default async function DetailPage({ params }: DetailPageProps) {
  const resolvedParams = await params;
  const detailPath = resolvedParams.detailPath;
  const result = await fetchDetail(detailPath);

  // Handle errors
  if (!result.ok) {
    // Only show 404 for actual not-found errors
    if (result.status === 404) {
      notFound();
    }
    // Show error UI for network/parse errors
    return <ErrorState error={result.error} detailPath={detailPath} />;
  }

  const detail = result.data;
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
            <Image
              src={backdropImage}
              alt=""
              fill
              className="object-cover object-top"
              priority
              aria-hidden="true"
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
                  <Image
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
              <DetailClient
                description={detail.description}
                detailPath={detailPath}
              />

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

      {/* Video Player & Episodes Section */}
      {hasSeasons ? (
        <EpisodePlayer
          contentId={detail.id}
          detailPath={detailPath}
          seasons={detail.seasons!}
          initialPlayerUrl={detail.playerUrl}
          title={detail.title}
        />
      ) : (
        <section id="player" className="container-main py-8">
          <h2 className="text-xl font-semibold mb-4">Watch</h2>
          <Suspense
            fallback={<div className="aspect-video skeleton rounded-lg" />}
          >
            <VideoPlayer embedSrc={detail.playerUrl} title={detail.title} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
