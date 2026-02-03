"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Last watched episode data
 */
export interface LastWatchedData {
  season: number;
  episode: number;
  updatedAt: number;
  playbackTime?: number;
}

/**
 * Generate localStorage key for a title
 */
function getStorageKey(titleKey: string): string {
  return `noirflix_last_watched:${titleKey}`;
}

/**
 * Subscribe to storage changes
 */
function createSubscribe(storageKey: string) {
  return (callback: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      // Trigger on matching key or null (clear all)
      if (e.key === storageKey || e.key === null) {
        callback();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Hook to manage last watched episode for a specific title
 * Uses useSyncExternalStore with STABLE snapshot (primitive string)
 *
 * @param titleKey - Unique key for the title (e.g., detailPath)
 * @returns Object with lastWatched data and update function
 */
export function useLastWatched(titleKey: string) {
  const storageKey = getStorageKey(titleKey);

  // Subscribe function - memoized per storageKey
  const subscribe = useCallback(
    (callback: () => void) => createSubscribe(storageKey)(callback),
    [storageKey],
  );

  // ✅ CRITICAL: getSnapshot MUST return a PRIMITIVE (string)
  // Returning an object/array causes infinite loop because React
  // compares by reference and JSON.parse always creates new objects
  const getSnapshot = useCallback((): string => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(storageKey) ?? "";
  }, [storageKey]);

  // Server snapshot - always empty string
  const getServerSnapshot = useCallback((): string => "", []);

  // Raw string from localStorage (stable primitive)
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // ✅ Parse JSON only via useMemo, keyed on the raw string
  // This ensures we only re-parse when the string actually changes
  const lastWatched = useMemo<LastWatchedData | null>(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;

      // Validate shape
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "season" in parsed &&
        "episode" in parsed &&
        "updatedAt" in parsed &&
        typeof (parsed as LastWatchedData).season === "number" &&
        typeof (parsed as LastWatchedData).episode === "number" &&
        typeof (parsed as LastWatchedData).updatedAt === "number"
      ) {
        return parsed as LastWatchedData;
      }
      return null;
    } catch {
      return null;
    }
  }, [raw]);

  // Update last watched in localStorage
  const updateLastWatched = useCallback(
    (season: number, episode: number, playbackTime?: number) => {
      const data: LastWatchedData = {
        season,
        episode,
        playbackTime,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(data));
      // Dispatch storage event to trigger re-render in this tab
      window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
    },
    [storageKey],
  );

  // Clear last watched
  const clearLastWatched = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new StorageEvent("storage", { key: storageKey }));
  }, [storageKey]);

  return {
    lastWatched,
    updateLastWatched,
    clearLastWatched,
  };
}
