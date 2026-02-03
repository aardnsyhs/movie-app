"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Loader2, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayer } from "@/components";
import { EpisodeBrowser } from "@/components/content/EpisodeBrowser";
import { fetchStreamSources } from "@/lib/api";
import { getPlayerBaseUrlFromAnyPlayerUrl, buildPlayerUrl } from "@/lib/utils";
import { useLastWatched } from "@/hooks/useLastWatched";
import type {
  ParsedSeason,
  ParsedDownloadSource,
  ParsedCaption,
} from "@/lib/schemas";

interface EpisodePlayerProps {
  contentId: string;
  detailPath: string;
  seasons: ParsedSeason[];
  initialPlayerUrl?: string;
  title: string;
}

interface StreamState {
  downloads: ParsedDownloadSource[];
  captions: ParsedCaption[];
  playerUrl?: string;
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
  const searchParams = useSearchParams();

  // Last watched hook
  const { lastWatched, updateLastWatched } = useLastWatched(detailPath);

  // Stream loading state
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [streamState, setStreamState] = useState<StreamState>({
    downloads: [],
    captions: [],
    playerUrl: initialPlayerUrl,
  });

  // Get first season/episode as fallback
  const firstSeason = seasons[0]?.seasonNumber ?? 1;
  const firstEpisode = seasons[0]?.episodes[0]?.episodeNumber ?? 1;

  /**
   * Determine initial selection based on priority:
   * 1. URL query params (?season=X&episode=Y)
   * 2. Last watched from localStorage
   * 3. First episode
   */
  const getInitialSelection = useCallback((): {
    season: number;
    episode: number;
  } => {
    // Check URL params first
    const urlSeason = searchParams.get("season");
    const urlEpisode = searchParams.get("episode");

    if (urlSeason && urlEpisode) {
      const s = parseInt(urlSeason, 10);
      const e = parseInt(urlEpisode, 10);
      if (!isNaN(s) && !isNaN(e) && isValidSelection(seasons, s, e)) {
        return { season: s, episode: e };
      }
    }

    // Check last watched
    if (
      lastWatched &&
      isValidSelection(seasons, lastWatched.season, lastWatched.episode)
    ) {
      return { season: lastWatched.season, episode: lastWatched.episode };
    }

    // Fallback to first
    return { season: firstSeason, episode: firstEpisode };
  }, [searchParams, lastWatched, seasons, firstSeason, firstEpisode]);

  // Compute initial selection once
  const initialSelection = useMemo(
    () => getInitialSelection(),
    [getInitialSelection],
  );

  // Initialize state with computed initial values
  const [activeSeason, setActiveSeason] = useState(() =>
    findSeasonIndex(seasons, initialSelection.season),
  );
  const [selectedEpisode, setSelectedEpisode] = useState(
    () => initialSelection.episode,
  );

  const currentSeason = seasons[activeSeason];
  const currentSeasonNumber = currentSeason?.seasonNumber ?? 1;

  // Derive player base URL from any available playerUrl
  const playerBaseUrl = useMemo(() => {
    // Try to find any episode with a playerUrl
    for (const season of seasons) {
      for (const ep of season.episodes) {
        if (ep.playerUrl) {
          return getPlayerBaseUrlFromAnyPlayerUrl(ep.playerUrl);
        }
      }
    }
    // Fallback to initialPlayerUrl
    if (initialPlayerUrl) {
      return getPlayerBaseUrlFromAnyPlayerUrl(initialPlayerUrl);
    }
    return null;
  }, [seasons, initialPlayerUrl]);

  /**
   * Update URL query params (shallow update, no page reload)
   */
  const updateUrlParams = useCallback(
    (seasonNum: number, episodeNum: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("season", String(seasonNum));
      params.set("episode", String(episodeNum));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  /**
   * Compute the player URL for current episode
   */
  const computePlayerUrl = useCallback(
    (seasonNum: number, episodeNum: number): string | undefined => {
      const episode = findEpisode(seasons, seasonNum, episodeNum);

      // Prefer episode's own playerUrl
      if (episode?.playerUrl) {
        return episode.playerUrl;
      }

      // Build URL from base
      if (playerBaseUrl) {
        return buildPlayerUrl({
          base: playerBaseUrl,
          id: contentId,
          detailPath,
          season: seasonNum,
          episode: episodeNum,
        });
      }

      return initialPlayerUrl;
    },
    [seasons, playerBaseUrl, contentId, detailPath, initialPlayerUrl],
  );

  /**
   * Fetch stream sources for selected episode
   */
  const loadStreamSources = useCallback(
    async (seasonNum: number, episodeNum: number) => {
      setIsLoadingStream(true);

      const fallbackUrl = computePlayerUrl(seasonNum, episodeNum);

      try {
        const result = await fetchStreamSources({
          id: contentId,
          detailPath,
          season: seasonNum,
          episode: episodeNum,
        });

        if (result.ok && result.data.downloads.length > 0) {
          setStreamState({
            downloads: result.data.downloads,
            captions: result.data.captions,
            playerUrl: fallbackUrl,
          });
        } else {
          // Use iframe fallback
          setStreamState({
            downloads: [],
            captions: [],
            playerUrl: fallbackUrl,
          });
        }
      } catch {
        // Use iframe fallback on error
        setStreamState({
          downloads: [],
          captions: [],
          playerUrl: fallbackUrl,
        });
      } finally {
        setIsLoadingStream(false);
      }
    },
    [contentId, detailPath, computePlayerUrl],
  );

  // Load stream when episode changes
  useEffect(() => {
    loadStreamSources(currentSeasonNumber, selectedEpisode);
  }, [currentSeasonNumber, selectedEpisode, loadStreamSources]);

  /**
   * Handle season change from EpisodeBrowser
   */
  const handleSeasonChange = useCallback(
    (index: number) => {
      setActiveSeason(index);
      // Reset to first episode of new season
      const firstEp = seasons[index]?.episodes[0]?.episodeNumber ?? 1;
      setSelectedEpisode(firstEp);

      const newSeasonNum = seasons[index]?.seasonNumber ?? 1;
      updateUrlParams(newSeasonNum, firstEp);
      updateLastWatched(newSeasonNum, firstEp);
    },
    [seasons, updateUrlParams, updateLastWatched],
  );

  /**
   * Handle episode selection
   */
  const handleEpisodeSelect = useCallback(
    (seasonNum: number, episodeNum: number) => {
      // Find and set the correct season index
      const seasonIndex = findSeasonIndex(seasons, seasonNum);
      setActiveSeason(seasonIndex);
      setSelectedEpisode(episodeNum);

      // Update URL and localStorage
      updateUrlParams(seasonNum, episodeNum);
      updateLastWatched(seasonNum, episodeNum);

      // Scroll to player
      document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
    },
    [seasons, updateUrlParams, updateLastWatched],
  );
  /**
   * Continue watching button handler
   */
  const handleContinueWatching = useCallback(() => {
    if (!lastWatched) return;
    handleEpisodeSelect(lastWatched.season, lastWatched.episode);
  }, [lastWatched, handleEpisodeSelect]);

  // Generate unique player key for iframe remount
  const playerKey = `${contentId}-${currentSeasonNumber}-${selectedEpisode}`;

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
                  {isLoadingStream && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className="px-3 py-1 bg-[var(--surface-secondary)] rounded-full">
                    S{currentSeasonNumber} • E{selectedEpisode}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <VideoPlayer
              title={title}
              playerUrl={streamState.playerUrl}
              downloads={streamState.downloads}
              captions={streamState.captions}
              isLoading={isLoadingStream}
              playerKey={playerKey}
            />

            {/* Continue Watching Button (mobile) */}
            {lastWatched &&
              (lastWatched.season !== currentSeasonNumber ||
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
                (lastWatched.season !== currentSeasonNumber ||
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
            onSelect={handleEpisodeSelect}
            onSeasonChange={handleSeasonChange}
          />
        </div>
      </section>
    </>
  );
}
