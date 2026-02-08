"use client";

import { useRef, useMemo, useState, useCallback, useEffect, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import { Search, Play, ChevronDown, Clock, X, Check } from "lucide-react";
import { ThumbnailImage } from "./PosterImage";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import type { ParsedSeason, ParsedEpisode } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface EpisodeBrowserProps {
  seasons: ParsedSeason[];
  activeSeason: number;
  activeEpisode: number;
  lastWatchedSeason?: number;
  lastWatchedEpisode?: number;
  detailPath?: string; // For progress lookup
  onSelect: (season: number, episode: number) => void;
  onSeasonChange: (seasonIndex: number) => void;
}

// Increased row height for larger cards
const EPISODE_CARD_HEIGHT = 140;
const OVERSCAN_COUNT = 3;

/**
 * Netflix-style Episode Browser with premium UI
 *
 * Features:
 * - 2-column grid on desktop, 1-column on mobile
 * - Large 16:9 thumbnails with hover scale
 * - Subtle red glow border for active episode
 * - Progress bar support (future)
 * - Season accordion structure
 * - Virtualized list for performance
 */
export function EpisodeBrowser({
  seasons,
  activeSeason,
  activeEpisode,
  lastWatchedSeason,
  lastWatchedEpisode,
  detailPath,
  onSelect,
  onSeasonChange,
}: EpisodeBrowserProps) {
  const { getProgress } = useWatchProgress();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSeasonExpanded, setIsSeasonExpanded] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentSeason = seasons[activeSeason];
  const currentSeasonNumber = currentSeason?.seasonNumber ?? 1;

  // Filter episodes by search query
  const filteredEpisodes = useMemo(() => {
    if (!currentSeason?.episodes) return [];

    if (!searchQuery.trim()) {
      return currentSeason.episodes;
    }

    const query = searchQuery.toLowerCase().trim();
    return currentSeason.episodes.filter((ep) => {
      const epNumStr = String(ep.episodeNumber);
      const title = ep.title?.toLowerCase() ?? "";
      const epLabel = `episode ${ep.episodeNumber}`.toLowerCase();
      const eLabel = `e${ep.episodeNumber}`.toLowerCase();

      return (
        epNumStr.includes(query) ||
        title.includes(query) ||
        epLabel.includes(query) ||
        eLabel.includes(query)
      );
    });
  }, [currentSeason?.episodes, searchQuery]);

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: filteredEpisodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => EPISODE_CARD_HEIGHT,
    overscan: OVERSCAN_COUNT,
  });

  // Scroll to active episode on mount and season change
  const scrollToActiveEpisode = useCallback(() => {
    const activeIndex = filteredEpisodes.findIndex(
      (ep) => ep.episodeNumber === activeEpisode,
    );
    if (activeIndex > -1) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(activeIndex, { align: "center" });
      });
    }
  }, [filteredEpisodes, activeEpisode, virtualizer]);

  useEffect(() => {
    if (!searchQuery) {
      scrollToActiveEpisode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeason]);

  // Clear search when season changes
  useEffect(() => {
    setSearchQuery("");
  }, [activeSeason]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  const handleEpisodeKeyDown = useCallback(
    (e: React.KeyboardEvent, episode: ParsedEpisode) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(currentSeasonNumber, episode.episodeNumber);
      }
    },
    [currentSeasonNumber, onSelect],
  );

  const isLastWatched = useCallback(
    (ep: ParsedEpisode) => {
      return (
        lastWatchedSeason === currentSeasonNumber &&
        lastWatchedEpisode === ep.episodeNumber
      );
    },
    [currentSeasonNumber, lastWatchedSeason, lastWatchedEpisode],
  );

  // Jump to episode handler
  const handleJumpToEpisode = useCallback(
    (episodeNum: number) => {
      const index = filteredEpisodes.findIndex(
        (ep) => ep.episodeNumber === episodeNum,
      );
      if (index > -1) {
        virtualizer.scrollToIndex(index, { align: "center" });
      }
    },
    [filteredEpisodes, virtualizer],
  );

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Header: Search */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search episodes... (Press /)"
            className={cn(
              "w-full pl-10 pr-10 py-2.5 rounded-lg",
              "bg-white/5 border border-white/10",
              "text-white placeholder:text-white/30",
              "focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30",
              "transition-colors",
            )}
            aria-label="Search episodes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          )}
        </div>

        {/* Quick Jump */}
        {currentSeason && currentSeason.episodes.length > 20 && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>Jump to:</span>
            <div className="flex gap-1 flex-wrap">
              {[1, 10, 20, 30, 40, 50].map((num) => {
                const exists = currentSeason.episodes.some(
                  (ep) => ep.episodeNumber === num,
                );
                if (!exists) return null;
                return (
                  <button
                    key={num}
                    onClick={() => handleJumpToEpisode(num)}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    E{num}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Season Accordion */}
      {seasons.length > 1 ? (
        <div className="flex-shrink-0 border-b border-white/10">
          {seasons.map((season, index) => {
            const isActive = activeSeason === index;
            const isExpanded = isActive && isSeasonExpanded;

            return (
              <div key={season.id || index}>
                <button
                  onClick={() => {
                    if (isActive) {
                      setIsSeasonExpanded(!isSeasonExpanded);
                    } else {
                      onSeasonChange(index);
                      setIsSeasonExpanded(true);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3",
                    "hover:bg-white/5 transition-colors",
                    isActive && "bg-white/5",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn("font-medium", isActive && "text-red-500")}
                    >
                      {season.title || `Season ${season.seasonNumber}`}
                    </span>
                    <span className="text-xs text-white/40">
                      {season.episodes.length} episodes
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/50" />
                  </motion.div>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        // Single season header
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {currentSeason?.title || `Season ${currentSeasonNumber}`}
            </span>
            <span className="text-xs text-white/40">
              {currentSeason?.episodes.length ?? 0} episodes
            </span>
          </div>
        </div>
      )}

      {/* Episode List */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        role="listbox"
        aria-label="Episode list"
      >
        {filteredEpisodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/50">
            <Search className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">No episodes match your search</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm text-red-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const episode = filteredEpisodes[virtualRow.index];
              const isActive =
                currentSeasonNumber === currentSeason?.seasonNumber &&
                activeEpisode === episode.episodeNumber;
              const isLastWatchedEp = isLastWatched(episode);

              return (
                <div
                  key={
                    episode.id ||
                    `${currentSeasonNumber}-${episode.episodeNumber}`
                  }
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <EpisodeCard
                    episode={episode}
                    isActive={isActive}
                    isLastWatched={isLastWatchedEp}
                    progress={
                      detailPath
                        ? getProgress(
                            detailPath,
                            currentSeasonNumber,
                            episode.episodeNumber,
                          )?.percentage
                        : undefined
                    }
                    onSelect={() =>
                      onSelect(currentSeasonNumber, episode.episodeNumber)
                    }
                    onKeyDown={(e) => handleEpisodeKeyDown(e, episode)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 text-xs text-white/40 flex items-center justify-between">
        <span>
          {searchQuery
            ? `${filteredEpisodes.length} of ${currentSeason?.episodes.length ?? 0}`
            : `${currentSeason?.episodes.length ?? 0} episodes`}
        </span>
        <span className="hidden sm:inline">↑↓ Navigate • Enter to play</span>
      </div>
    </div>
  );
}

/**
 * Netflix-style Episode Card
 *
 * Visual States:
 * - idle: bg-transparent, subtle border
 * - hover: bg-white/10, thumbnail scale, glow
 * - active: red glow border, left accent bar, play overlay
 * - watched: progress bar, check icon
 */
interface EpisodeCardProps {
  episode: ParsedEpisode;
  isActive: boolean;
  isLastWatched: boolean;
  progress?: number; // 0-100 percentage
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const EpisodeCard = memo(function EpisodeCard({
  episode,
  isActive,
  isLastWatched,
  progress,
  onSelect,
  onKeyDown,
}: EpisodeCardProps) {
  const hasProgress =
    typeof progress === "number" && progress > 0 && progress < 90;
  return (
    <motion.button
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "w-full h-full flex gap-4 p-3 text-left transition-all duration-200 group relative",
        "focus:outline-none",
        // Active state: subtle red glow border + left accent
        isActive && [
          "bg-red-500/10",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-500 before:rounded-r",
          "ring-1 ring-red-500/30",
        ],
        // Hover state
        !isActive && "hover:bg-white/10",
      )}
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      whileTap={{ scale: 0.99 }}
    >
      {/* Thumbnail (16:9) */}
      <div
        className={cn(
          "relative flex-shrink-0 w-32 md:w-40 aspect-video rounded-lg overflow-hidden bg-white/5",
          "transition-transform duration-200",
          "group-hover:scale-[1.03]",
          isActive && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/20",
        )}
      >
        <ThumbnailImage
          src={episode.cover}
          alt={`Episode ${episode.episodeNumber}`}
        />

        {/* Play overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40",
            "transition-opacity duration-200",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {isActive ? (
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Check className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-5 h-5 fill-black text-black ml-0.5" />
            </div>
          )}
        </div>

        {/* Progress bar */}
        {hasProgress && !isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-red-600"
              style={{ width: `${Math.min(progress || 0, 100)}%` }}
            />
          </div>
        )}

        {/* Watched badge */}
        {typeof progress === "number" && progress >= 90 && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
        {/* Episode number (muted) */}
        <span className="text-xs text-white/40 mb-1">
          E{episode.episodeNumber}
        </span>

        {/* Title */}
        <h4
          className={cn(
            "font-semibold text-sm md:text-base line-clamp-1",
            isActive ? "text-red-400" : "text-white",
          )}
        >
          {episode.title || `Episode ${episode.episodeNumber}`}
        </h4>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-1.5">
          {episode.runtime && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Clock className="w-3 h-3" />
              {episode.runtime}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-2">
          {isActive && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2 py-0.5 text-xs font-medium text-white bg-red-500 rounded"
            >
              Now Playing
            </motion.span>
          )}
          {isLastWatched && !isActive && (
            <span className="px-2 py-0.5 text-xs text-white/60 bg-white/10 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              Last watched
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
});
