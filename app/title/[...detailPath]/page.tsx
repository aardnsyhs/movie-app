import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Play, Plus, ArrowLeft, Clock, Calendar } from "lucide-react";
import { fetchDetail } from "@/lib/api";
import { formatRating, truncateText } from "@/lib/utils";
import { VideoPlayer, HeroSkeleton } from "@/components";
import { DetailClient } from "./DetailClient";

interface DetailPageProps {
  params: Promise<{ detailPath: string[] }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const detailPath = resolvedParams.detailPath.join("/");
  const detail = await fetchDetail(detailPath);

  if (!detail) {
    return {
      title: "Not Found",
    };
  }

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

export default async function DetailPage({ params }: DetailPageProps) {
  const resolvedParams = await params;
  const detailPath = resolvedParams.detailPath.join("/");
  const detail = await fetchDetail(detailPath);

  if (!detail) {
    notFound();
  }

  const backdropImage = detail.backdrop || detail.poster;

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
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm">
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
                {detail.genre && (
                  <span className="text-[var(--foreground-muted)]">
                    {detail.genre}
                  </span>
                )}
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

      {/* Video Player Section */}
      <section id="player" className="container-main py-8">
        <h2 className="text-xl font-semibold mb-4">Watch</h2>
        <Suspense
          fallback={<div className="aspect-video skeleton rounded-lg" />}
        >
          <VideoPlayer playerUrl={detail.playerUrl} title={detail.title} />
        </Suspense>
      </section>

      {/* Episodes Section (for TV) */}
      {detail.type === "tv" && detail.seasons && detail.seasons.length > 0 && (
        <section className="container-main py-8">
          <h2 className="text-xl font-semibold mb-6">Episodes</h2>
          <div className="space-y-6">
            {detail.seasons.map((season) => (
              <div key={season.id || season.seasonNumber}>
                <h3 className="text-lg font-medium mb-4 text-[var(--foreground-muted)]">
                  {season.title || `Season ${season.seasonNumber}`}
                </h3>
                <div className="grid gap-3">
                  {season.episodes.map((episode) => (
                    <a
                      key={episode.id || episode.episodeNumber}
                      href={episode.playerUrl || "#player"}
                      className="flex items-center gap-4 p-4 bg-[var(--surface-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] transition-colors">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Episode {episode.episodeNumber}
                          {episode.title && `: ${episode.title}`}
                        </p>
                        {episode.runtime && (
                          <p className="text-sm text-[var(--foreground-muted)]">
                            {episode.runtime}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
