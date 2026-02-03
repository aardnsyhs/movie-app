"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Check if URL is a "heavy" proxy that should NOT be optimized by Next.js
 * These URLs cause 504 timeouts when Next Image Optimization tries to fetch them
 */
export function isHeavyProxyUrl(url: string): boolean {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();

  // Check for known slow proxy patterns
  if (lowerUrl.includes("/image-proxy.php")) return true;
  if (lowerUrl.includes("/img-proxy")) return true;

  // Check for base64-encoded URL parameters (often slow proxies)
  try {
    const urlObj = new URL(url);
    const urlParam = urlObj.searchParams.get("url");
    // If there's a URL param that's very long (likely base64), it's probably a proxy
    if (urlParam && urlParam.length > 100) return true;
  } catch {
    // Invalid URL, treat as heavy to be safe
    return true;
  }

  return false;
}

interface PosterImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Force unoptimized mode regardless of URL detection */
  forceUnoptimized?: boolean;
  /** Callback when image fails to load */
  onError?: () => void;
}

/**
 * Optimized poster/backdrop image component
 *
 * - Uses `unoptimized` for heavy proxy URLs to avoid 504 timeouts
 * - Includes error fallback handling
 * - Smooth fade-in animation on load
 * - Lazy loading by default (except when priority=true)
 */
export function PosterImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  className,
  forceUnoptimized = false,
  onError,
}: PosterImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // If no src or error, show placeholder
  if (!src || hasError) {
    return (
      <div
        className={cn(
          "bg-[var(--surface-secondary)] flex items-center justify-center",
          fill && "absolute inset-0",
          className,
        )}
        style={!fill ? { width, height } : undefined}
        aria-hidden="true"
      >
        {/* Placeholder icon */}
        <svg
          className="w-12 h-12 text-[var(--foreground-subtle)] opacity-40"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 5h13v7h2V5c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h8v-2H4V5z" />
          <path d="m8 11-3 4h11l-4-6-3 4z" />
          <path d="M19 14h-2v3h-3v2h3v3h2v-3h3v-2h-3z" />
        </svg>
      </div>
    );
  }

  // Determine if we should skip Next.js image optimization
  const shouldSkipOptimization = forceUnoptimized || isHeavyProxyUrl(src);

  const imageProps = {
    src,
    alt,
    sizes,
    priority,
    onError: handleError,
    onLoad: handleLoad,
    className: cn(
      className,
      "transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0",
    ),
    // Skip optimization for heavy proxy URLs
    unoptimized: shouldSkipOptimization,
    // Lazy load unless priority
    loading: priority ? undefined : ("lazy" as const),
    // Async decoding for better performance
    decoding: "async" as const,
  };

  if (fill) {
    return <Image {...imageProps} fill alt={alt} />;
  }

  return (
    <Image
      {...imageProps}
      width={width || 342}
      height={height || 513}
      alt={alt}
    />
  );
}

/**
 * Backdrop-specific image component (wider aspect ratio)
 */
interface BackdropImageProps extends Omit<
  PosterImageProps,
  "width" | "height"
> {
  /** Override default sizes for backdrop */
  sizes?: string;
}

export function BackdropImage({
  sizes = "100vw",
  ...props
}: BackdropImageProps) {
  return (
    <PosterImage
      {...props}
      sizes={sizes}
      fill
      // Backdrops are always heavy - force unoptimized
      forceUnoptimized
    />
  );
}

/**
 * Thumbnail image for episode lists (smaller, fixed size)
 */
interface ThumbnailImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function ThumbnailImage({ src, alt, className }: ThumbnailImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-[var(--surface-secondary)] flex items-center justify-center",
          className,
        )}
        aria-hidden="true"
      >
        <svg
          className="w-6 h-6 text-[var(--foreground-subtle)] opacity-40"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }

  // Thumbnails: always unoptimized since they come from same proxy
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes="112px"
      unoptimized
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}
