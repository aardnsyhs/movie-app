"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, User } from "lucide-react";

export interface CastItem {
  name: string;
  character?: string;
  avatar?: string;
}

interface CastSectionProps {
  cast: CastItem[];
}

const MAX_VISIBLE_DEFAULT = 12;

/**
 * Avatar placeholder component (inline SVG)
 */
function AvatarPlaceholder() {
  return (
    <div className="w-full h-full bg-[var(--surface-secondary)] flex items-center justify-center">
      <User className="w-8 h-8 text-[var(--foreground-subtle)]" />
    </div>
  );
}

/**
 * Individual cast card component
 */
function CastCard({ cast }: { cast: CastItem }) {
  const [imageError, setImageError] = useState(false);
  const hasAvatar = cast.avatar && !imageError;

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors min-w-[100px] md:min-w-0">
      {/* Avatar - circular */}
      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-[var(--surface-secondary)]">
        {hasAvatar ? (
          <Image
            src={cast.avatar!}
            alt={cast.name}
            fill
            className="object-cover"
            sizes="80px"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <AvatarPlaceholder />
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-center line-clamp-1 w-full">
        {cast.name}
      </p>

      {/* Character */}
      {cast.character && (
        <p className="text-xs text-[var(--foreground-muted)] text-center line-clamp-1 w-full">
          {cast.character}
        </p>
      )}
    </div>
  );
}

/**
 * Cast section with horizontal scroll (mobile) / grid (desktop)
 * Shows max 12 by default with "Show all" button
 */
export function CastSection({ cast }: CastSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!cast || cast.length === 0) {
    return null;
  }

  const visibleCast = showAll ? cast : cast.slice(0, MAX_VISIBLE_DEFAULT);
  const hasMore = cast.length > MAX_VISIBLE_DEFAULT;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Cast</h2>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {showAll ? (
              <>
                Show less
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show all ({cast.length})
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {visibleCast.map((item, index) => (
          <CastCard key={`${item.name}-${index}`} cast={item} />
        ))}
      </div>

      {/* Desktop grid - max 6 columns */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleCast.map((item, index) => (
          <CastCard key={`${item.name}-${index}`} cast={item} />
        ))}
      </div>
    </section>
  );
}
