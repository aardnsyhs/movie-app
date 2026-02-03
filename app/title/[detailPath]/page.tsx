import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DetailPageClient } from "./DetailClient";

interface DetailPageProps {
  params: Promise<{ detailPath: string }>;
}

/**
 * Static metadata - NO fetch blocking
 * SEO is based on detailPath slug only for fast TTFB
 */
export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const detailPath = resolvedParams.detailPath;

  // Extract title from detailPath slug (e.g., "agen-62-Kz4X1EN6d3a" -> "Agen 62")
  const titleFromSlug =
    detailPath
      .split("-")
      .slice(0, -1) // Remove the ID suffix
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Watch";

  return {
    title: `${titleFromSlug} - NoirFlix`,
    description: `Watch ${titleFromSlug} on NoirFlix - Your premium streaming destination`,
    openGraph: {
      title: `${titleFromSlug} - NoirFlix`,
      description: `Watch ${titleFromSlug} on NoirFlix`,
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleFromSlug} - NoirFlix`,
    },
  };
}

/**
 * Loading skeleton for detail page
 */
function DetailSkeleton() {
  return (
    <div className="-mt-16">
      {/* Hero Background Skeleton */}
      <section className="relative min-h-[70vh] flex items-end">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-secondary)] to-[var(--background)]" />

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
            {/* Poster Skeleton */}
            <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
              <div className="aspect-[2/3] rounded-lg skeleton" />
            </div>

            {/* Info Skeleton */}
            <div className="flex-1 text-center md:text-left">
              {/* Type Badge */}
              <div className="h-6 w-20 skeleton rounded-full mb-3 mx-auto md:mx-0" />

              {/* Title */}
              <div className="h-12 w-3/4 skeleton rounded mb-4 mx-auto md:mx-0" />

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                <div className="h-6 w-16 skeleton rounded" />
                <div className="h-6 w-20 skeleton rounded" />
                <div className="h-6 w-24 skeleton rounded" />
              </div>

              {/* Genre Badges */}
              <div className="flex justify-center md:justify-start gap-2 mb-6">
                <div className="h-6 w-16 skeleton rounded-full" />
                <div className="h-6 w-20 skeleton rounded-full" />
                <div className="h-6 w-14 skeleton rounded-full" />
              </div>

              {/* Description */}
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-5/6 skeleton rounded" />
                <div className="h-4 w-4/6 skeleton rounded" />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="h-12 w-32 skeleton rounded-lg" />
                <div className="h-12 w-32 skeleton rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Player Skeleton */}
      <section className="container-main py-8">
        <div className="h-8 w-24 skeleton rounded mb-4" />
        <div className="aspect-video skeleton rounded-lg" />
      </section>
    </div>
  );
}

/**
 * Detail Page - Shell-first architecture
 *
 * Server Component renders:
 * - Skeleton UI instantly
 * - Mounts DetailPageClient which fetches data via SWR
 *
 * NO blocking await fetchDetail() - TTFB is instant
 */
export default async function DetailPage({ params }: DetailPageProps) {
  const resolvedParams = await params;
  const detailPath = resolvedParams.detailPath;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DetailPageClient detailPath={detailPath} />
    </Suspense>
  );
}
