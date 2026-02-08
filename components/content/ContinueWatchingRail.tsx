"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { cn } from "@/lib/utils";

/**
 * Continue Watching Rail
 * Shows content that user has started but not finished watching
 *
 * - Only renders if there are items in progress
 * - Shows progress bar on each card
 * - Navigates to ?season=X&episode=Y for TV shows
 */
export function ContinueWatchingRail() {
  const { getContinueWatching } = useWatchProgress();
  const items = getContinueWatching();

  // Don't render if no items
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">Continue Watching</h2>
      </div>

      <div className="relative group">
        {/* Horizontal scroll container */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
          {items.map((item, index) => (
            <ContinueWatchingCard
              key={`${item.detailPath}-${item.season ?? 0}-${item.episode ?? 0}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ContinueWatchingCardProps {
  item: {
    detailPath: string;
    progress: { percentage: number; timestamp: number };
    season?: number;
    episode?: number;
  };
  index: number;
}

function ContinueWatchingCard({ item, index }: ContinueWatchingCardProps) {
  // Build URL with season/episode params
  const href = useMemo(() => {
    const base = `/title/${item.detailPath}`;
    if (item.season !== undefined && item.episode !== undefined) {
      return `${base}?season=${item.season}&episode=${item.episode}`;
    }
    return base;
  }, [item.detailPath, item.season, item.episode]);

  // Format episode label
  const episodeLabel = useMemo(() => {
    if (item.season !== undefined && item.episode !== undefined) {
      return `S${item.season} E${item.episode}`;
    }
    return null;
  }, [item.season, item.episode]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="flex-shrink-0 w-[140px] md:w-[180px] group/card"
    >
      <Link
        href={href}
        className={cn(
          "block relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--surface-primary)]",
          "transform-gpu transition-all duration-300",
          "hover:scale-[1.05] hover:z-10",
          "hover:shadow-xl hover:shadow-black/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
        )}
      >
        {/* Poster placeholder - will show fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* "Continue" badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] uppercase tracking-wider bg-red-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded">
            Continue
          </span>
        </div>

        {/* Episode label (for TV shows) */}
        {episodeLabel && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
              {episodeLabel}
            </span>
          </div>
        )}

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-red-600 transition-all"
            style={{ width: `${Math.min(item.progress.percentage, 100)}%` }}
          />
        </div>
      </Link>

      {/* Title (show detailPath as fallback) */}
      <p className="mt-2 text-xs text-white/60 truncate">
        {item.detailPath
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())}
      </p>
    </motion.article>
  );
}
