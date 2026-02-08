"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { ContentRail, ContentGrid, RailSkeleton } from "@/components";
import { CategoryHeader } from "@/components/content/CategoryHeader";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { buildAPIUrl, swrFetcher, swrConfig } from "@/lib/api";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import type { ParsedAPIListResponse } from "@/lib/schemas";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

const EMPTY_RESPONSE: ParsedAPIListResponse = {
  success: false,
  items: [],
  page: 1,
  hasMore: false,
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
    swrFetcher,
    { ...swrConfig, fallbackData: EMPTY_RESPONSE },
  );

  if (isLoading && !data?.items.length) {
    return <RailSkeleton />;
  }

  if (error && !data?.items.length) {
    return (
      <section className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center justify-center gap-4 py-12 bg-white/5 rounded-lg border border-white/10">
          <AlertCircle className="w-5 h-5 text-white/50" />
          <span className="text-sm text-white/50">Failed to load</span>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500 rounded-md hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data?.items.length) return null;

  return <ContentRail title={title} items={data.items} />;
}

/**
 * Category Grid with infinite scroll
 */
function CategoryGridWithData({ category }: { category: Category }) {
  const getKey = (
    pageIndex: number,
    prevData: ParsedAPIListResponse | null,
  ) => {
    if (prevData && !prevData.hasMore) return null;
    return buildAPIUrl(category, pageIndex + 1);
  };

  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<ParsedAPIListResponse>(getKey, swrFetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  const items = data?.flatMap((page) => page.items) ?? [];
  const isLoading = !data && !error;
  const isLoadingMore = isValidating && size > 1;
  const hasMore = data?.[data.length - 1]?.hasMore ?? true;

  const handleLoadMore = useCallback(() => {
    if (!isValidating && hasMore) setSize((prev) => prev + 1);
  }, [isValidating, hasMore, setSize]);

  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading: isValidating,
  });

  return (
    <>
      <CategoryHeader
        category={category}
        itemCount={items.length || undefined}
      />
      <section className="container-main py-8">
        <ContentGrid
          items={items}
          isLoading={isLoading}
          error={error}
          onRetry={() => mutate()}
          emptyMessage={`No ${CATEGORY_LABELS[category] || category} content available`}
        />
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
 * All rails view (home)
 */
function AllRailsView() {
  return (
    <div className="container-main space-y-2">
      {ALL_CATEGORIES.map(({ category, title }) => (
        <RailWithData key={category} title={title} category={category} />
      ))}
    </div>
  );
}

/**
 * Inner content that reads searchParams
 */
function HomeRailsInner() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") as Category | null;
  const isHome = !urlCategory || urlCategory === "trending";

  if (isHome) {
    return <AllRailsView />;
  }

  return <CategoryGridWithData category={urlCategory} />;
}

/**
 * Streamed rails component (used by page.tsx via Suspense)
 */
export function HomeRails() {
  return (
    <Suspense
      fallback={
        <div className="container-main space-y-2">
          <RailSkeleton />
          <RailSkeleton />
        </div>
      }
    >
      <HomeRailsInner />
    </Suspense>
  );
}
