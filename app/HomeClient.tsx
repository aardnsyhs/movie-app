"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import {
  HeroSlider,
  ContentRail,
  ContentGrid,
  HeroSkeleton,
  RailSkeleton,
} from "@/components";
import { CategoryHeader } from "@/components/content/CategoryHeader";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { buildAPIUrl, swrFetcherWithTimeout, swrFetcher } from "@/lib/api";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import type { ParsedAPIListResponse } from "@/lib/schemas";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

/** Empty response fallback */
const EMPTY_RESPONSE: ParsedAPIListResponse = {
  success: false,
  items: [],
  page: 1,
  hasMore: false,
};

/** SWR config for homepage */
const swrConfig = {
  dedupingInterval: 60000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 1,
  errorRetryInterval: 2000,
  keepPreviousData: true,
};

const ALL_CATEGORIES: { category: Category; title: string }[] = [
  { category: "trending", title: "Trending Now" },
  { category: "indonesian-movies", title: "Film Indonesia" },
  { category: "indonesian-drama", title: "Drama Indonesia" },
  { category: "kdrama", title: "K-Drama" },
  { category: "short-tv", title: "Short TV" },
  { category: "anime", title: "Anime" },
];

/**
 * Rail with SWR data fetching
 */
function RailWithData({
  title,
  category,
}: {
  title: string;
  category: Category;
}) {
  const { data, error, isLoading, mutate } = useSWR<ParsedAPIListResponse>(
    buildAPIUrl(category, 1),
    swrFetcherWithTimeout,
    {
      ...swrConfig,
      fallbackData: EMPTY_RESPONSE,
    },
  );

  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  if (isLoading && !data?.items.length) {
    return (
      <section className="py-4 md:py-6">
        <RailSkeleton />
      </section>
    );
  }

  if (error && !data?.items.length) {
    return (
      <section className="py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex items-center justify-center gap-4 py-12 px-4 bg-white/5 rounded-lg border border-white/10">
          <AlertCircle className="w-5 h-5 text-white/50" />
          <span className="text-sm text-white/50">Failed to load content</span>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }

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
 * Category Grid with infinite scroll
 */
function CategoryGridWithData({ category }: { category: Category }) {
  const getKey = (
    pageIndex: number,
    previousPageData: ParsedAPIListResponse | null,
  ) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return buildAPIUrl(category, pageIndex + 1);
  };

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<ParsedAPIListResponse>(getKey, swrFetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  const items = data ? data.flatMap((page) => page.items) : [];
  const isLoading = !data && !error;
  const isLoadingMore = isValidating && size > 1;
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : true;
  const totalItems = items.length;

  const handleLoadMore = useCallback(() => {
    if (!isValidating && hasMore) {
      setSize((prev) => prev + 1);
    }
  }, [isValidating, hasMore, setSize]);

  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: isValidating,
  });

  return (
    <>
      {/* Category Header */}
      <CategoryHeader category={category} itemCount={totalItems || undefined} />

      {/* Content Grid */}
      <section className="container-main py-8">
        <ContentGrid
          items={items}
          isLoading={isLoading}
          error={error}
          onRetry={() => mutate()}
          emptyMessage={`No ${CATEGORY_LABELS[category]} content available`}
        />

        {/* Load More Trigger */}
        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-white/30 text-sm">You&apos;ve reached the end</p>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Home view - all rails
 */
function HomeView() {
  return (
    <>
      <HeroWithData />
      <div className="container-main space-y-2">
        {ALL_CATEGORIES.map(({ category, title }) => (
          <RailWithData key={category} title={title} category={category} />
        ))}
      </div>
    </>
  );
}

/**
 * Category view - specific category grid
 */
function CategoryView({ category }: { category: Category }) {
  return <CategoryGridWithData category={category} />;
}

/**
 * Inner content that uses searchParams
 */
function HomeContentInner() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") as Category | null;

  // Determine if we're on home or a specific category
  const isHome = !urlCategory || urlCategory === "trending";

  if (isHome) {
    return <HomeView />;
  }

  return <CategoryView category={urlCategory} />;
}

/**
 * Loading fallback
 */
function HomeLoadingFallback() {
  return (
    <>
      <HeroSkeleton />
      <div className="container-main space-y-2">
        <RailSkeleton />
        <RailSkeleton />
      </div>
    </>
  );
}

/**
 * Client-side home page with SWR data fetching
 * Behavior:
 * - No category param or "trending" → Hero + all rails
 * - Specific category → Category header + paginated grid
 */
export function HomeClient() {
  return (
    <SWRConfig value={swrConfig}>
      <Suspense fallback={<HomeLoadingFallback />}>
        <HomeContentInner />
      </Suspense>
    </SWRConfig>
  );
}
