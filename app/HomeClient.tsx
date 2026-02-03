"use client";

import { Suspense, useCallback } from "react";
import useSWR, { SWRConfig } from "swr";
import {
  HeroSlider,
  ContentRail,
  HeroSkeleton,
  RailSkeleton,
} from "@/components";
import { HomeContent } from "./HomeContent";
import { buildAPIUrl, swrFetcherWithTimeout } from "@/lib/api";
import type { ParsedAPIListResponse } from "@/lib/schemas";
import { AlertCircle, RefreshCw } from "lucide-react";

/** Empty response fallback */
const EMPTY_RESPONSE: ParsedAPIListResponse = {
  success: false,
  items: [],
  page: 1,
  hasMore: false,
};

/** SWR config for homepage - aggressive caching, no spam */
const swrConfig = {
  dedupingInterval: 60000, // 1 minute deduplication
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 1,
  errorRetryInterval: 2000,
  keepPreviousData: true,
};

/**
 * Rail with SWR data fetching and error handling
 */
function RailWithData({
  title,
  category,
}: {
  title: string;
  category: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<ParsedAPIListResponse>(
    buildAPIUrl(category as "trending", 1),
    swrFetcherWithTimeout,
    {
      ...swrConfig,
      fallbackData: EMPTY_RESPONSE,
    },
  );

  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Loading state
  if (isLoading && !data?.items.length) {
    return (
      <section className="py-4 md:py-6">
        <RailSkeleton />
      </section>
    );
  }

  // Error state with retry
  if (error && !data?.items.length) {
    return (
      <section className="py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex items-center justify-center gap-4 py-12 px-4 bg-[var(--surface-primary)] rounded-lg border border-[var(--border-primary)]">
          <AlertCircle className="w-5 h-5 text-[var(--foreground-muted)]" />
          <span className="text-sm text-[var(--foreground-muted)]">
            Failed to load content
          </span>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-primary)]/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  // Empty state
  if (!data?.items.length) {
    return null;
  }

  return <ContentRail title={title} items={data.items} />;
}

/**
 * Hero with SWR data fetching
 */
function HeroWithData() {
  const { data, isLoading } = useSWR<ParsedAPIListResponse>(
    buildAPIUrl("trending", 1),
    swrFetcherWithTimeout,
    {
      ...swrConfig,
      fallbackData: EMPTY_RESPONSE,
    },
  );

  if (isLoading && !data?.items.length) {
    return <HeroSkeleton />;
  }

  if (!data?.items.length) {
    return <HeroSkeleton />;
  }

  return <HeroSlider items={data.items} />;
}

/**
 * Client-side home page with SWR data fetching
 * No SSR blocking - renders skeleton immediately, fetches data client-side
 */
export function HomeClient() {
  return (
    <SWRConfig value={swrConfig}>
      {/* Hero Section */}
      <HeroWithData />

      {/* Content Rails */}
      <div className="container-main space-y-2">
        <RailWithData title="Trending Now" category="trending" />
        <RailWithData title="Film Indonesia" category="indonesian-movies" />
        <RailWithData title="Drama Indonesia" category="indonesian-drama" />
        <RailWithData title="K-Drama" category="kdrama" />
        <RailWithData title="Short TV" category="short-tv" />
        <RailWithData title="Anime" category="anime" />
      </div>

      {/* Category Grid Section (uses its own SWR) */}
      <Suspense
        fallback={
          <div className="container-main py-8">
            <RailSkeleton />
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </SWRConfig>
  );
}
