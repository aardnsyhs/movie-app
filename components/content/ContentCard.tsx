"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Play, Plus, Check } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";
import { PosterImage } from "./PosterImage";
import type { ContentItem } from "@/lib/types";

interface ContentCardProps {
  item: ContentItem;
  index?: number;
  priority?: boolean;
  /** Show progress bar if available */
  progress?: number;
  /** Whether item is in watchlist */
  isInWatchlist?: boolean;
  /** Callback when watchlist is toggled */
  onWatchlistToggle?: () => void;
}

/**
 * Netflix-style Content Card with:
 * - 150ms hover delay to prevent flicker
 * - Scale + elevation on hover
 * - Glow effect
 * - Focus-visible ring for a11y
 * - Optional progress bar
 * - Optional watchlist indicator
 */
export function ContentCard({
  item,
  index = 0,
  priority = false,
  progress,
  isInWatchlist,
  onWatchlistToggle,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const detailUrl = `/title/${item.detailPath}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={detailUrl}
        className={cn(
          "block relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--surface-primary)]",
          // Netflix-style hover with delay
          "transform-gpu transition-all duration-300",
          // Scale and elevation on hover
          "hover:scale-[1.08] hover:z-10",
          // Shadow and glow
          "hover:shadow-2xl hover:shadow-black/60",
          "hover:ring-2 hover:ring-white/20",
          // Focus visible for a11y
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:scale-[1.08] focus-visible:z-10",
        )}
        aria-label={`View ${item.title}`}
        style={{
          // 150ms hover delay via CSS
          transitionDelay: isHovered ? "0ms" : "150ms",
        }}
      >
        {/* Poster Image */}
        <PosterImage
          src={item.poster}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300"
          priority={priority}
        />

        {/* Hover Overlay with metadata */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        >
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Rating */}
            {item.rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
                <span className="text-sm font-medium">
                  {formatRating(item.rating)}
                </span>
              </div>
            )}

            {/* Year & Genre */}
            <div className="flex items-center gap-2 text-xs text-white/70">
              {item.year && <span>{item.year}</span>}
              {item.year && item.genre && <span>•</span>}
              {item.genre && (
                <span className="truncate">{item.genre.split(",")[0]}</span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onWatchlistToggle?.();
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  "border border-white/40 hover:border-white",
                  isInWatchlist
                    ? "bg-white text-black"
                    : "bg-black/50 text-white",
                )}
                aria-label={isInWatchlist ? "Remove from list" : "Add to list"}
              >
                {isInWatchlist ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "badge text-[10px] uppercase tracking-wider backdrop-blur-sm",
              item.type === "tv"
                ? "bg-blue-600/80"
                : "bg-[var(--accent-primary)]/80",
            )}
          >
            {item.type === "tv" ? "Series" : "Movie"}
          </span>
        </div>

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-transform group-hover:scale-110">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Progress Bar (if has watch progress) */}
        {typeof progress === "number" && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-red-600"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Watched Badge (if >90% watched) */}
        {typeof progress === "number" && progress >= 90 && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </Link>

      {/* Title below card */}
      <h3 className="mt-2 text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
        <Link href={detailUrl}>{item.title}</Link>
      </h3>
    </motion.article>
  );
}
