"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "noirflix:progress";

interface WatchProgress {
  /** Watched percentage (0-100) */
  percentage: number;
  /** Last watched timestamp */
  timestamp: number;
  /** Current position in seconds */
  currentTime?: number;
  /** Total duration in seconds */
  duration?: number;
}

interface WatchProgressMap {
  [key: string]: WatchProgress;
}

/**
 * Build storage key for watch progress
 * Format: noirflix:progress:{detailPath}:{season}:{episode}
 */
function buildKey(
  detailPath: string,
  season?: number,
  episode?: number,
): string {
  if (season !== undefined && episode !== undefined) {
    return `${STORAGE_KEY_PREFIX}:${detailPath}:${season}:${episode}`;
  }
  return `${STORAGE_KEY_PREFIX}:${detailPath}`;
}

/**
 * Get all progress data from localStorage
 */
function getAllProgress(): WatchProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save all progress data to localStorage
 */
function saveAllProgress(data: WatchProgressMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing watch progress per content item
 *
 * Usage:
 * ```tsx
 * const { progress, updateProgress, isWatched, getContinueWatching } = useWatchProgress();
 *
 * // Get progress for a specific content
 * const contentProgress = progress('my-movie');
 *
 * // Update progress
 * updateProgress('my-movie', { percentage: 45, currentTime: 1200, duration: 2700 });
 *
 * // Check if watched
 * const watched = isWatched('my-movie');
 * ```
 */
export function useWatchProgress() {
  const [progressMap, setProgressMap] = useState<WatchProgressMap>({});

  // Load from localStorage on mount
  useEffect(() => {
    setProgressMap(getAllProgress());
  }, []);

  /**
   * Get progress for a specific content
   */
  const getProgress = useCallback(
    (
      detailPath: string,
      season?: number,
      episode?: number,
    ): WatchProgress | null => {
      const key = buildKey(detailPath, season, episode);
      return progressMap[key] || null;
    },
    [progressMap],
  );

  /**
   * Update progress for a content item
   */
  const updateProgress = useCallback(
    (
      detailPath: string,
      data: Partial<WatchProgress>,
      season?: number,
      episode?: number,
    ) => {
      const key = buildKey(detailPath, season, episode);
      const existing = progressMap[key] || {
        percentage: 0,
        timestamp: Date.now(),
      };

      const updated: WatchProgressMap = {
        ...progressMap,
        [key]: {
          ...existing,
          ...data,
          timestamp: Date.now(),
        },
      };

      setProgressMap(updated);
      saveAllProgress(updated);
    },
    [progressMap],
  );

  /**
   * Check if content is watched (>90%)
   */
  const isWatched = useCallback(
    (detailPath: string, season?: number, episode?: number): boolean => {
      const prog = getProgress(detailPath, season, episode);
      return prog ? prog.percentage >= 90 : false;
    },
    [getProgress],
  );

  /**
   * Clear progress for a content item
   */
  const clearProgress = useCallback(
    (detailPath: string, season?: number, episode?: number) => {
      const key = buildKey(detailPath, season, episode);
      const updated = { ...progressMap };
      delete updated[key];
      setProgressMap(updated);
      saveAllProgress(updated);
    },
    [progressMap],
  );

  /**
   * Get all "Continue Watching" items sorted by timestamp
   */
  const getContinueWatching = useCallback((): Array<{
    detailPath: string;
    progress: WatchProgress;
    season?: number;
    episode?: number;
  }> => {
    const items = Object.entries(progressMap)
      .filter(([_, value]) => value.percentage > 0 && value.percentage < 90)
      .map(([key, value]) => {
        const parts = key.replace(`${STORAGE_KEY_PREFIX}:`, "").split(":");
        return {
          detailPath: parts[0],
          progress: value,
          season: parts[1] ? parseInt(parts[1]) : undefined,
          episode: parts[2] ? parseInt(parts[2]) : undefined,
        };
      })
      .sort((a, b) => b.progress.timestamp - a.progress.timestamp);

    return items.slice(0, 20); // Max 20 items
  }, [progressMap]);

  return {
    getProgress,
    updateProgress,
    isWatched,
    clearProgress,
    getContinueWatching,
  };
}
