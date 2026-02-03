"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { VideoPlayer } from "@/components";
import type { ParsedSeason } from "@/lib/schemas";

interface EpisodePlayerProps {
  seasons: ParsedSeason[];
  initialPlayerUrl?: string;
  title: string;
}

export function EpisodePlayer({
  seasons,
  initialPlayerUrl,
  title,
}: EpisodePlayerProps) {
  const [activeSeason, setActiveSeason] = useState(0);
  const [activePlayerUrl, setActivePlayerUrl] = useState(
    initialPlayerUrl || seasons[0]?.episodes[0]?.playerUrl || "",
  );
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);

  const currentSeason = seasons[activeSeason];

  const handleEpisodeClick = (
    playerUrl: string | undefined,
    episodeId: string,
  ) => {
    if (playerUrl) {
      setActivePlayerUrl(playerUrl);
      setActiveEpisodeId(episodeId);
      // Scroll to player
      document.getElementById("player")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Video Player Section */}
      <section id="player" className="container-main py-8">
        <h2 className="text-xl font-semibold mb-4">Watch</h2>
        <VideoPlayer playerUrl={activePlayerUrl} title={title} />
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
                onClick={() => setActiveSeason(index)}
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
              const episodeKey = `${currentSeason.seasonNumber}-${episode.episodeNumber}`;
              const isActive = activeEpisodeId === episodeKey;

              return (
                <button
                  key={episode.id || episodeKey}
                  onClick={() =>
                    handleEpisodeClick(episode.playerUrl, episodeKey)
                  }
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
                </button>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
