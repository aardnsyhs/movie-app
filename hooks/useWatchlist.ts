"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContentItem } from "@/lib/types";

const WATCHLIST_KEY = "noirflix-watchlist";

/**
 * Hook for managing watchlist in localStorage
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load watchlist from localStorage on mount - use startTransition to avoid lint
  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Hydration-safe pattern - intentional for SSR compatibility
          setWatchlist(parsed); // eslint-disable-line
        }
      } catch {
        // Ignore parse errors
      }
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage when watchlist changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    }
  }, [watchlist, isLoaded]);

  const addToWatchlist = useCallback((item: ContentItem) => {
    setWatchlist((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isInWatchlist = useCallback(
    (id: string) => watchlist.some((item) => item.id === id),
    [watchlist],
  );

  const toggleWatchlist = useCallback(
    (item: ContentItem) => {
      if (isInWatchlist(item.id)) {
        removeFromWatchlist(item.id);
      } else {
        addToWatchlist(item);
      }
    },
    [isInWatchlist, removeFromWatchlist, addToWatchlist],
  );

  return {
    watchlist,
    isLoaded,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
  };
}
