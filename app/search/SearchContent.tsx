"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Search, X } from "lucide-react";
import { ContentGrid } from "@/components";
import { useDebounce } from "@/hooks/useDebounce";
import { buildSearchUrl, swrFetcher } from "@/lib/api";

interface SearchContentProps {
  initialQuery: string;
}

export function SearchContent({ initialQuery }: SearchContentProps) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 400);
  const router = useRouter();

  // Update URL when query changes
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`, {
        scroll: false,
      });
    } else if (debouncedQuery === "" && initialQuery) {
      router.replace("/search", { scroll: false });
    }
  }, [debouncedQuery, router, initialQuery]);

  // Fetch search results
  const { data, error, isLoading, mutate } = useSWR(
    debouncedQuery.trim() ? buildSearchUrl(debouncedQuery.trim()) : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const items = data?.items || [];

  return (
    <div>
      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
        <input
          type="search"
          placeholder="Search movies, series, anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-12 py-4 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl text-lg placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          aria-label="Search content"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--surface-hover)]"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 text-[var(--foreground-muted)]" />
          </button>
        )}
      </div>

      {/* Results */}
      {!debouncedQuery.trim() ? (
        <div className="py-20 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-[var(--foreground-subtle)]" />
          <p className="text-lg text-[var(--foreground-muted)]">
            Start typing to search for content
          </p>
        </div>
      ) : (
        <>
          {!isLoading && items.length > 0 && (
            <p className="text-[var(--foreground-muted)] mb-6">
              Found {items.length} result{items.length !== 1 ? "s" : ""} for
              &quot;{debouncedQuery}&quot;
            </p>
          )}
          <ContentGrid
            items={items}
            isLoading={isLoading}
            error={error}
            onRetry={() => mutate()}
            emptyMessage={`No results found for "${debouncedQuery}"`}
          />
        </>
      )}
    </div>
  );
}
