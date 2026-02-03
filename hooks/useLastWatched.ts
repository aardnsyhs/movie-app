"use client";

import { useCallback, useSyncExternalStore } from "react";

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
 * Get last watched data from localStorage (safe for SSR)
 */
export function getLastWatched(titleKey: string): LastWatchedData | null {
  if (typeof window === "undefined") return null;

  try {
    const key = getStorageKey(titleKey);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;

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
}

/**
 * Set last watched data in localStorage
 */
export function setLastWatched(
  titleKey: string,
  data: Omit<LastWatchedData, "updatedAt">,
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(titleKey);
    const fullData: LastWatchedData = {
      ...data,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(fullData));
    // Dispatch storage event to trigger re-render
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Clear last watched data for a title
 */
export function clearLastWatched(titleKey: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(titleKey);
    localStorage.removeItem(key);
    // Dispatch storage event to trigger re-render
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    // Silently fail
  }
}

/**
 * Hook to manage last watched episode for a specific title
 * Uses useSyncExternalStore for React 19 compatibility
 *
 * @param titleKey - Unique key for the title (e.g., detailPath)
 * @returns Object with lastWatched data and update function
 */
export function useLastWatched(titleKey: string) {
  const storageKey = getStorageKey(titleKey);

  // Subscribe to storage changes
  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey || e.key === null) {
          callback();
        }
      };
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    },
    [storageKey],
  );

  // Get current snapshot
  const getSnapshot = useCallback(() => {
    return getLastWatched(titleKey);
  }, [titleKey]);

  // Server snapshot (always null)
  const getServerSnapshot = useCallback(() => null, []);

  const lastWatched = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Update last watched in localStorage
  const updateLastWatched = useCallback(
    (season: number, episode: number, playbackTime?: number) => {
      const data: Omit<LastWatchedData, "updatedAt"> = {
        season,
        episode,
        playbackTime,
      };
      setLastWatched(titleKey, data);
    },
    [titleKey],
  );

  // Clear last watched
  const clear = useCallback(() => {
    clearLastWatched(titleKey);
  }, [titleKey]);

  return {
    lastWatched,
    isLoaded: true, // Always loaded with useSyncExternalStore
    updateLastWatched,
    clearLastWatched: clear,
  };
}
