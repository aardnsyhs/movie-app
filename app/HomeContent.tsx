"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { ContentGrid } from "@/components";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { buildAPIUrl, swrFetcher } from "@/lib/api";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import type { ParsedAPIListResponse } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const categories: Category[] = [
  "trending",
  "indonesian-movies",
  "indonesian-drama",
  "kdrama",
  "short-tv",
  "anime",
];

export function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category") as Category | null;
  const [activeCategory, setActiveCategory] = useState<Category>(
    categoryParam || "trending",
  );

  // SWR Infinite for pagination
  const getKey = (
    pageIndex: number,
    previousPageData: ParsedAPIListResponse | null,
  ) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return buildAPIUrl(activeCategory, pageIndex + 1);
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

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    router.push(`/?category=${category}`, { scroll: false });
    // Reset SWR state
    setSize(1);
    mutate();
    // Scroll to top of grid
    document
      .getElementById("category-grid")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="category-grid" className="container-main py-8 md:py-12">
      {/* Category Tabs */}
      <div className="mb-8">
        <h2 className="sr-only">Browse by Category</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === category
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--surface-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]",
              )}
              aria-pressed={activeCategory === category}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <ContentGrid
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        emptyMessage={`No ${CATEGORY_LABELS[activeCategory]} content available`}
      />

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more...</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-[var(--foreground-subtle)] text-sm">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </section>
  );
}
