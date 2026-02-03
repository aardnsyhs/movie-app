"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, ChevronDown, Clock, X, Check } from "lucide-react";
import type { ParsedSeason, ParsedEpisode } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface EpisodeBrowserProps {
  seasons: ParsedSeason[];
  activeSeason: number;
  activeEpisode: number;
  lastWatchedSeason?: number;
  lastWatchedEpisode?: number;
  onSelect: (season: number, episode: number) => void;
  onSeasonChange: (seasonIndex: number) => void;
}

const EPISODE_ROW_HEIGHT = 88;
const OVERSCAN_COUNT = 5;

/**
 * Netflix-style Episode Browser with search and virtualization
 */
export function EpisodeBrowser({
  seasons,
  activeSeason,
  activeEpisode,
  lastWatchedSeason,
  lastWatchedEpisode,
  onSelect,
  onSeasonChange,
}: EpisodeBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
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
    estimateSize: () => EPISODE_ROW_HEIGHT,
    overscan: OVERSCAN_COUNT,
  });

  // Scroll to active episode when season changes
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

  // Effect to scroll when season changes (not on every episode change)
  useEffect(() => {
    if (!searchQuery) {
      scrollToActiveEpisode();
    }
    // Only run when activeSeason changes, not on every dependency change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeason]);

  // Clear search when season changes
  useEffect(() => {
    setSearchQuery("");
  }, [activeSeason]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' key
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Clear search on Escape
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  // Handle episode selection with keyboard
  const handleEpisodeKeyDown = useCallback(
    (e: React.KeyboardEvent, episode: ParsedEpisode) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(currentSeasonNumber, episode.episodeNumber);
      }
    },
    [currentSeasonNumber, onSelect],
  );

  // Check if an episode is the last watched one
  const isLastWatched = useCallback(
    (ep: ParsedEpisode) => {
      return (
        lastWatchedSeason === currentSeasonNumber &&
        lastWatchedEpisode === ep.episodeNumber
      );
    },
    [currentSeasonNumber, lastWatchedSeason, lastWatchedEpisode],
  );

  return (
    <div className="flex flex-col h-full bg-[var(--surface-primary)] rounded-xl overflow-hidden border border-[var(--border-primary)]">
      {/* Header: Season Selector + Search */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-primary)] space-y-3">
        {/* Season Selector */}
        {seasons.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsSeasonDropdownOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-lg",
                "bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)]",
                "text-left font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface-primary)]",
              )}
              aria-expanded={isSeasonDropdownOpen}
              aria-haspopup="listbox"
            >
              <span>
                {currentSeason?.title || `Season ${currentSeasonNumber}`}
              </span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 transition-transform",
                  isSeasonDropdownOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {isSeasonDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 z-20 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl overflow-hidden"
                  role="listbox"
                >
                  {seasons.map((season, index) => (
                    <button
                      key={season.id || index}
                      onClick={() => {
                        onSeasonChange(index);
                        setIsSeasonDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors",
                        "hover:bg-[var(--surface-hover)]",
                        "focus:outline-none focus:bg-[var(--surface-hover)]",
                        activeSeason === index &&
                          "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]",
                      )}
                      role="option"
                      aria-selected={activeSeason === index}
                    >
                      <span>
                        {season.title || `Season ${season.seasonNumber}`}
                      </span>
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {season.episodes.length} episodes
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search episodes... (Press /)"
            className={cn(
              "w-full pl-10 pr-10 py-2.5 rounded-lg",
              "bg-[var(--surface-secondary)] border border-transparent",
              "placeholder:text-[var(--foreground-subtle)]",
              "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]",
              "transition-colors",
            )}
            aria-label="Search episodes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-[var(--foreground-muted)]" />
            </button>
          )}
        </div>
      </div>

      {/* Episode List */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        role="listbox"
        aria-label="Episode list"
      >
        {filteredEpisodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[var(--foreground-muted)]">
            <Search className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">No episodes match your search</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm text-[var(--accent-primary)] hover:underline"
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
                  <EpisodeRow
                    episode={episode}
                    isActive={isActive}
                    isLastWatched={isLastWatchedEp}
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

      {/* Footer: Episode count */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-[var(--border-primary)] text-xs text-[var(--foreground-muted)]">
        {searchQuery ? (
          <span>
            {filteredEpisodes.length} of {currentSeason?.episodes.length ?? 0}{" "}
            episodes
          </span>
        ) : (
          <span>{currentSeason?.episodes.length ?? 0} episodes</span>
        )}
      </div>
    </div>
  );
}

/**
 * Episode row component (memoized for virtualization performance)
 */
interface EpisodeRowProps {
  episode: ParsedEpisode;
  isActive: boolean;
  isLastWatched: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function EpisodeRow({
  episode,
  isActive,
  isLastWatched,
  onSelect,
  onKeyDown,
}: EpisodeRowProps) {
  return (
    <motion.button
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "w-full h-full flex items-center gap-3 px-4 text-left transition-colors group",
        "focus:outline-none focus:bg-[var(--surface-hover)]",
        isActive
          ? "bg-[var(--accent-primary)]/15"
          : "hover:bg-[var(--surface-hover)]",
      )}
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      whileTap={{ scale: 0.99 }}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-28 h-16 rounded-md overflow-hidden bg-[var(--surface-secondary)]">
        {episode.cover ? (
          <Image
            src={episode.cover}
            alt={`Episode ${episode.episodeNumber}`}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-6 h-6 text-[var(--foreground-subtle)]" />
          </div>
        )}

        {/* Play overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isActive && "opacity-100",
          )}
        >
          {isActive ? (
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-semibold text-sm",
              isActive && "text-[var(--accent-primary)]",
            )}
          >
            E{episode.episodeNumber}
          </span>
          {episode.title &&
            episode.title !== `Episode ${episode.episodeNumber}` && (
              <span className="text-sm truncate text-[var(--foreground)]">
                {episode.title}
              </span>
            )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-1">
          {episode.runtime && (
            <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
              <Clock className="w-3 h-3" />
              {episode.runtime}
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {isActive && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-2 py-0.5 text-xs font-medium text-white bg-[var(--accent-primary)] rounded"
          >
            Now Playing
          </motion.span>
        )}
        {isLastWatched && !isActive && (
          <span className="px-2 py-0.5 text-xs text-[var(--foreground-muted)] bg-[var(--surface-secondary)] rounded">
            Last watched
          </span>
        )}
      </div>
    </motion.button>
  );
}
