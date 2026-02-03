"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { RailSkeleton } from "./CardSkeleton";
import type { ContentItem } from "@/lib/types";

interface ContentRailProps {
  title: string;
  items: ContentItem[];
  isLoading?: boolean;
}

export function ContentRail({
  title,
  items,
  isLoading = false,
}: ContentRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="py-4 md:py-6">
        <RailSkeleton />
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-6 group/rail">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>

        {/* Navigation Arrows - visible on hover for desktop */}
        <div className="hidden md:flex items-center gap-2 opacity-0 group-hover/rail:opacity-100 transition-opacity">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-[var(--container-padding)] px-[var(--container-padding)]"
      >
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-36 md:w-44"
          >
            <ContentCard item={item} index={index} priority={index < 6} />
          </div>
        ))}
      </div>
    </section>
  );
}
