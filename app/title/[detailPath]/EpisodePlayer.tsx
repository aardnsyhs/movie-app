"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Play, Loader2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayer } from "@/components";
import { EpisodeBrowser } from "@/components/content/EpisodeBrowser";
import {
  getPlayerBaseUrlFromAnyPlayerUrl,
  buildPlayerUrl,
  assertNoBlockedDomain,
} from "@/lib/utils";
import { getPlayerBaseUrl } from "@/lib/api";
import { useLastWatched } from "@/hooks/useLastWatched";
import type { ParsedSeason } from "@/lib/schemas";

interface EpisodePlayerProps {
  contentId: string;
  detailPath: string;
  seasons: ParsedSeason[];
  initialPlayerUrl?: string;
  title: string;
}

/**
 * Find episode by season and episode number
 */
function findEpisode(
  seasons: ParsedSeason[],
  seasonNum: number,
  episodeNum: number,
) {
  const season = seasons.find((s) => s.seasonNumber === seasonNum);
  if (!season) return null;
  const episode = season.episodes.find((e) => e.episodeNumber === episodeNum);
  return episode || null;
}

/**
 * Find season index by season number
 */
function findSeasonIndex(seasons: ParsedSeason[], seasonNum: number): number {
  const idx = seasons.findIndex((s) => s.seasonNumber === seasonNum);
  return idx >= 0 ? idx : 0;
}

/**
 * Validate if season and episode exist
 */
function isValidSelection(
  seasons: ParsedSeason[],
  seasonNum: number,
  episodeNum: number,
): boolean {
  return findEpisode(seasons, seasonNum, episodeNum) !== null;
}

export function EpisodePlayer({
  contentId,
  detailPath,
  seasons,
  initialPlayerUrl,
  title,
}: EpisodePlayerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Last watched hook (stable - no infinite loop)
  const { lastWatched, updateLastWatched } = useLastWatched(detailPath);

  // Player URL state (embed-first, no direct stream)
  const [currentPlayerUrl, setCurrentPlayerUrl] = useState<string | undefined>(
    initialPlayerUrl,
  );
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);

  // Get first season/episode as fallback
  const firstSeason = seasons[0]?.seasonNumber ?? 1;
  const firstEpisode = seasons[0]?.episodes[0]?.episodeNumber ?? 1;

  // Parse URL params once (stable refs)
  const qpSeason = Number(searchParams.get("season")) || 0;
  const qpEpisode = Number(searchParams.get("episode")) || 0;

  // Compute initial selection (runs only on mount)
  const getInitialValues = (): { season: number; episode: number } => {
    // Priority 1: Valid URL params
    if (
      qpSeason > 0 &&
      qpEpisode > 0 &&
      isValidSelection(seasons, qpSeason, qpEpisode)
    ) {
      return { season: qpSeason, episode: qpEpisode };
    }
    // Priority 2: Last watched from localStorage
    if (
      lastWatched &&
      isValidSelection(seasons, lastWatched.season, lastWatched.episode)
    ) {
      return { season: lastWatched.season, episode: lastWatched.episode };
    }
    // Priority 3: First episode
    return { season: firstSeason, episode: firstEpisode };
  };

  // Initialize state (only once on mount)
  const initialRef = useRef<{ season: number; episode: number } | null>(null);
  if (initialRef.current === null) {
    initialRef.current = getInitialValues();
  }
  const initial = initialRef.current;

  const [selectedSeason, setSelectedSeason] = useState(initial.season);
  const [selectedEpisode, setSelectedEpisode] = useState(initial.episode);

  // Derived: activeSeason index (for EpisodeBrowser)
  const activeSeason = findSeasonIndex(seasons, selectedSeason);

  // ═══════════════════════════════════════════════════════════════════
  // EFFECT #1: URL → State (only when URL changes externally)
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Only sync if URL has valid values AND they differ from state
    if (
      qpSeason > 0 &&
      qpEpisode > 0 &&
      isValidSelection(seasons, qpSeason, qpEpisode)
    ) {
      if (qpSeason !== selectedSeason) {
        setSelectedSeason(qpSeason);
      }
      if (qpEpisode !== selectedEpisode) {
        setSelectedEpisode(qpEpisode);
      }
    }
    // ❗ CRITICAL: Do NOT include selectedSeason/selectedEpisode in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qpSeason, qpEpisode, seasons]);

  // ═══════════════════════════════════════════════════════════════════
  // EFFECT #2: State → URL (only when state changes)
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const currentUrlSeason = searchParams.get("season");
    const currentUrlEpisode = searchParams.get("episode");

    const nextSeason = String(selectedSeason);
    const nextEpisode = String(selectedEpisode);

    // ✅ GUARD: Skip if URL already matches state
    if (currentUrlSeason === nextSeason && currentUrlEpisode === nextEpisode) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("season", nextSeason);
    params.set("episode", nextEpisode);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedSeason, selectedEpisode, pathname, router, searchParams]);

  // Derive player base URL from any available playerUrl or ENV
  const playerBaseUrl = useMemo(() => {
    // Priority 1: Extract from episode playerUrl
    for (const season of seasons) {
      for (const ep of season.episodes) {
        if (ep.playerUrl) {
          return getPlayerBaseUrlFromAnyPlayerUrl(ep.playerUrl);
        }
      }
    }
    // Priority 2: Extract from initialPlayerUrl
    if (initialPlayerUrl) {
      return getPlayerBaseUrlFromAnyPlayerUrl(initialPlayerUrl);
    }
    // Priority 3: Use ENV fallback
    return getPlayerBaseUrl();
  }, [seasons, initialPlayerUrl]);

  /**
   * Compute the player URL for current episode (embed-first)
   */
  const computePlayerUrl = useCallback(
    (seasonNum: number, episodeNum: number): string => {
      const episode = findEpisode(seasons, seasonNum, episodeNum);

      // Priority 1: Use episode's playerUrl if available
      if (episode?.playerUrl) {
        assertNoBlockedDomain(episode.playerUrl, "episode.playerUrl");
        return episode.playerUrl;
      }

      // Priority 2: Build URL from base
      const url = buildPlayerUrl({
        base: playerBaseUrl,
        id: contentId,
        detailPath,
        season: seasonNum,
        episode: episodeNum,
      });

      assertNoBlockedDomain(url, "computePlayerUrl");
      return url;
    },
    [seasons, playerBaseUrl, contentId, detailPath],
  );

  /**
   * Update player URL when episode changes (no external API call)
   */
  const updatePlayerUrl = useCallback(
    (seasonNum: number, episodeNum: number) => {
      setIsLoadingPlayer(true);
      const url = computePlayerUrl(seasonNum, episodeNum);
      setCurrentPlayerUrl(url);
      // Small delay to show loading state for smooth UX
      setTimeout(() => setIsLoadingPlayer(false), 100);
    },
    [computePlayerUrl],
  );

  // Update player URL when episode changes
  useEffect(() => {
    updatePlayerUrl(selectedSeason, selectedEpisode);
  }, [selectedSeason, selectedEpisode, updatePlayerUrl]);

  /**
   * Handle season change from EpisodeBrowser
   */
  const handleSeasonChange = useCallback(
    (index: number) => {
      const newSeason = seasons[index]?.seasonNumber ?? 1;
      const firstEp = seasons[index]?.episodes[0]?.episodeNumber ?? 1;

      setSelectedSeason(newSeason);
      setSelectedEpisode(firstEp);

      // Save to localStorage
      updateLastWatched(newSeason, firstEp);
    },
    [seasons, updateLastWatched],
  );

  /**
   * Handle episode selection
   */
  const handleEpisodeSelect = useCallback(
    (seasonNum: number, episodeNum: number) => {
      setSelectedSeason(seasonNum);
      setSelectedEpisode(episodeNum);

      // Save to localStorage
      updateLastWatched(seasonNum, episodeNum);

      // Scroll to player
      document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
    },
    [updateLastWatched],
  );

  /**
   * Continue watching button handler
   */
  const handleContinueWatching = useCallback(() => {
    if (!lastWatched) return;
    handleEpisodeSelect(lastWatched.season, lastWatched.episode);
  }, [lastWatched, handleEpisodeSelect]);

  // Generate unique player key for iframe remount
  const playerKey = `${contentId}-${selectedSeason}-${selectedEpisode}`;

  return (
    <>
      {/* Video Player Section */}
      <section id="player" className="container-main py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Player Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Watch</h2>
              {/* Now Playing Indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={playerKey}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]"
                >
                  {isLoadingPlayer && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className="px-3 py-1 bg-[var(--surface-secondary)] rounded-full">
                    S{selectedSeason} • E{selectedEpisode}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <VideoPlayer
              title={title}
              embedSrc={currentPlayerUrl}
              isLoading={isLoadingPlayer}
              playerKey={playerKey}
            />

            {/* Continue Watching Button (mobile) */}
            {lastWatched &&
              (lastWatched.season !== selectedSeason ||
                lastWatched.episode !== selectedEpisode) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 lg:hidden"
                >
                  <button
                    onClick={handleContinueWatching}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span>
                      Continue: S{lastWatched.season} • E{lastWatched.episode}
                    </span>
                  </button>
                </motion.div>
              )}
          </div>

          {/* Episode Browser Column (desktop) */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              {/* Continue Watching Button (desktop) */}
              {lastWatched &&
                (lastWatched.season !== selectedSeason ||
                  lastWatched.episode !== selectedEpisode) && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleContinueWatching}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-lg transition-colors border border-[var(--accent-primary)]/30"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">
                      Continue: S{lastWatched.season} • E{lastWatched.episode}
                    </span>
                  </motion.button>
                )}

              <EpisodeBrowser
                seasons={seasons}
                activeSeason={activeSeason}
                activeEpisode={selectedEpisode}
                lastWatchedSeason={lastWatched?.season}
                lastWatchedEpisode={lastWatched?.episode}
                detailPath={detailPath}
                onSelect={handleEpisodeSelect}
                onSeasonChange={handleSeasonChange}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Episode Browser Section (mobile/tablet) */}
      <section className="lg:hidden container-main pb-8">
        <h2 className="text-xl font-semibold mb-4">Episodes</h2>
        <div className="h-[500px]">
          <EpisodeBrowser
            seasons={seasons}
            activeSeason={activeSeason}
            activeEpisode={selectedEpisode}
            lastWatchedSeason={lastWatched?.season}
            lastWatchedEpisode={lastWatched?.episode}
            detailPath={detailPath}
            onSelect={handleEpisodeSelect}
            onSeasonChange={handleSeasonChange}
          />
        </div>
      </section>
    </>
  );
}
