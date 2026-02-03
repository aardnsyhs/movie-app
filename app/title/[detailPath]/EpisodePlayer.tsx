"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import { VideoPlayer } from "@/components";
import { fetchStreamSources } from "@/lib/api";
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
  iframeFallbackUrl?: string;
}

export function EpisodePlayer({
  contentId,
  detailPath,
  seasons,
  initialPlayerUrl,
  title,
}: EpisodePlayerProps) {
  // Selected season index
  const [activeSeason, setActiveSeason] = useState(0);
  // Selected episode number (1-based)
  const [selectedEpisode, setSelectedEpisode] = useState(
    seasons[0]?.episodes[0]?.episodeNumber ?? 1,
  );
  // Stream loading state
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  // Stream data
  const [streamState, setStreamState] = useState<StreamState>({
    downloads: [],
    captions: [],
    iframeFallbackUrl: initialPlayerUrl,
  });

  const currentSeason = seasons[activeSeason];
  const currentSeasonNumber = currentSeason?.seasonNumber ?? 1;

  /**
   * Fetch stream sources for selected episode
   */
  const loadStreamSources = useCallback(
    async (seasonNum: number, episodeNum: number) => {
      setIsLoadingStream(true);

      // Find the episode to get its playerUrl as fallback
      const season = seasons.find((s) => s.seasonNumber === seasonNum);
      const episode = season?.episodes.find(
        (e) => e.episodeNumber === episodeNum,
      );
      const fallbackUrl = episode?.playerUrl || initialPlayerUrl;

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
            iframeFallbackUrl: fallbackUrl,
          });
        } else {
          // Use iframe fallback
          setStreamState({
            downloads: [],
            captions: [],
            iframeFallbackUrl: fallbackUrl,
          });
        }
      } catch {
        // Use iframe fallback on error
        setStreamState({
          downloads: [],
          captions: [],
          iframeFallbackUrl: fallbackUrl,
        });
      } finally {
        setIsLoadingStream(false);
      }
    },
    [contentId, detailPath, seasons, initialPlayerUrl],
  );

  // Load stream on mount and when episode changes
  useEffect(() => {
    loadStreamSources(currentSeasonNumber, selectedEpisode);
  }, [currentSeasonNumber, selectedEpisode, loadStreamSources]);

  /**
   * Handle season tab click
   */
  const handleSeasonChange = (index: number) => {
    setActiveSeason(index);
    // Reset to first episode of new season
    const firstEpisode = seasons[index]?.episodes[0]?.episodeNumber ?? 1;
    setSelectedEpisode(firstEpisode);
  };

  /**
   * Handle episode click
   */
  const handleEpisodeClick = (episodeNumber: number) => {
    setSelectedEpisode(episodeNumber);
    // Scroll to player
    document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Video Player Section */}
      <section id="player" className="container-main py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Watch</h2>
          {/* Now Playing Indicator */}
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            {isLoadingStream && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="px-3 py-1 bg-[var(--surface-secondary)] rounded-full">
              Now playing: S{currentSeasonNumber} • E{selectedEpisode}
            </span>
          </div>
        </div>

        <VideoPlayer
          title={title}
          playerUrl={streamState.iframeFallbackUrl}
          downloads={streamState.downloads}
          captions={streamState.captions}
          isLoading={isLoadingStream}
        />
      </section>

      {/* Episodes Section */}
      <section className="container-main py-8">
        <h2 className="text-xl font-semibold mb-6">Episodes</h2>

        {/* Season Tabs */}
        {seasons.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {seasons.map((season, index) => (
              <button
                key={season.id || index}
                onClick={() => handleSeasonChange(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSeason === index
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--surface-primary)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {season.title || `Season ${season.seasonNumber}`}
              </button>
            ))}
          </div>
        )}

        {/* Episode List */}
        {currentSeason && (
          <div className="grid gap-3">
            {currentSeason.episodes.map((episode) => {
              const isActive =
                currentSeasonNumber === currentSeason.seasonNumber &&
                selectedEpisode === episode.episodeNumber;

              return (
                <button
                  key={episode.id || episode.episodeNumber}
                  onClick={() => handleEpisodeClick(episode.episodeNumber)}
                  className={`flex items-center gap-4 p-4 rounded-lg text-left transition-colors group ${
                    isActive
                      ? "bg-[var(--accent-primary)]/20 ring-2 ring-[var(--accent-primary)]"
                      : "bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[var(--accent-primary)]"
                        : "bg-[var(--surface-secondary)] group-hover:bg-[var(--accent-primary)]"
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      Episode {episode.episodeNumber}
                      {episode.title &&
                        episode.title !== `Episode ${episode.episodeNumber}` &&
                        `: ${episode.title}`}
                    </p>
                    {episode.runtime && (
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {episode.runtime}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <span className="text-xs text-[var(--accent-primary)] font-medium px-2 py-1 bg-[var(--accent-primary)]/10 rounded">
                      Playing
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
