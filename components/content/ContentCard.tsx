"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Play } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";
import type { ContentItem } from "@/lib/types";

interface ContentCardProps {
  item: ContentItem;
  index?: number;
  priority?: boolean;
}

export function ContentCard({
  item,
  index = 0,
  priority = false,
}: ContentCardProps) {
  const detailUrl = `/title/${item.detailPath}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      <Link
        href={detailUrl}
        className="block relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--surface-primary)] card-hover"
        aria-label={`View ${item.title}`}
      >
        {/* Poster Image */}
        {item.poster ? (
          <Image
            src={item.poster}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-secondary)]">
            <Play className="w-12 h-12 text-[var(--foreground-subtle)]" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
              {item.year && <span>{item.year}</span>}
              {item.year && item.genre && <span>•</span>}
              {item.genre && (
                <span className="truncate">{item.genre.split(",")[0]}</span>
              )}
            </div>
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "badge text-[10px] uppercase tracking-wider",
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
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>
      </Link>

      {/* Title below card */}
      <h3 className="mt-2 text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
        <Link href={detailUrl}>{item.title}</Link>
      </h3>
    </motion.article>
  );
}
