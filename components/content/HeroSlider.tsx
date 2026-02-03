"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSkeleton } from "./CardSkeleton";
import { BackdropImage } from "./PosterImage";
import { formatRating } from "@/lib/utils";
import type { ContentItem } from "@/lib/types";

interface HeroSliderProps {
  items: ContentItem[];
  isLoading?: boolean;
}

export function HeroSlider({ items, isLoading = false }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const heroItems = items.slice(0, 8);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroItems.length);
  }, [heroItems.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
  }, [heroItems.length]);

  // Auto-advance slider
  useEffect(() => {
    if (!isAutoPlaying || heroItems.length <= 1) return;

    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, heroItems.length, goToNext]);

  if (isLoading) {
    return <HeroSkeleton />;
  }

  if (heroItems.length === 0) {
    return null;
  }

  const currentItem = heroItems[currentIndex];

  return (
    <section
      className="relative h-[60vh] min-h-[400px] max-h-[700px] -mt-16 mb-8"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          {currentItem.poster && (
            <BackdropImage
              src={currentItem.poster}
              alt=""
              className="object-cover object-top"
              priority
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/60 to-transparent" />
          <div className="absolute inset-0 gradient-overlay" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full container-main flex items-end pb-16 md:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl"
          >
            {/* Meta info */}
            <div className="flex items-center gap-3 mb-3">
              {currentItem.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
                  <span className="text-sm font-medium">
                    {formatRating(currentItem.rating)}
                  </span>
                </div>
              )}
              {currentItem.year && (
                <span className="text-sm text-[var(--foreground-muted)]">
                  {currentItem.year}
                </span>
              )}
              {currentItem.genre && (
                <span className="text-sm text-[var(--foreground-muted)]">
                  {currentItem.genre.split(",")[0]}
                </span>
              )}
              <span className="badge badge-accent text-xs uppercase">
                {currentItem.type === "tv" ? "Series" : "Movie"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-6 line-clamp-2">
              {currentItem.title}
            </h1>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href={`/title/${currentItem.detailPath}`}
                className="btn-primary"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </Link>
              <Link
                href={`/title/${currentItem.detailPath}`}
                className="btn-secondary"
              >
                <Info className="w-5 h-5" />
                Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {heroItems.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {heroItems.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {heroItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-6 bg-[var(--accent-primary)]"
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
