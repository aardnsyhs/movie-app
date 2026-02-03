"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { assertNoBlockedDomain } from "@/lib/utils";

interface VideoPlayerProps {
  title: string;
  /** Embed player URL (iframe src) - the ONLY playback source */
  embedSrc?: string;
  isLoading?: boolean;
  /** Unique key to force remount (e.g., `${id}-${season}-${episode}`) */
  playerKey?: string;
}

/**
 * Inner player component that handles the actual playback (embed-only)
 */
function VideoPlayerInner({
  title,
  embedSrc,
  isLoading = false,
}: Omit<VideoPlayerProps, "playerKey">) {
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI states
  const [hasError, setHasError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Validate embedSrc doesn't point to blocked domains
  useEffect(() => {
    if (embedSrc) {
      assertNoBlockedDomain(embedSrc, "VideoPlayer.embedSrc");
    }
  }, [embedSrc]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (iframeTimeoutRef.current) {
        clearTimeout(iframeTimeoutRef.current);
      }
    };
  }, []);

  // Setup iframe load timeout (15s)
  useEffect(() => {
    if (iframeLoading && embedSrc) {
      iframeTimeoutRef.current = setTimeout(() => {
        if (iframeLoading) {
          setHasError(true);
          setIframeLoading(false);
        }
      }, 15000);

      return () => {
        if (iframeTimeoutRef.current) {
          clearTimeout(iframeTimeoutRef.current);
        }
      };
    }
  }, [iframeLoading, embedSrc]);

  /**
   * Handle iframe load success
   */
  const handleIframeLoad = () => {
    setIframeLoading(false);
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
    }
  };

  /**
   * Handle iframe error
   */
  const handleIframeError = () => {
    setIframeLoading(false);
    setHasError(true);
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
    }
  };

  /**
   * Open embed player in new tab
   */
  const handleOpenInNewTab = () => {
    if (embedSrc) {
      window.open(embedSrc, "_blank", "noopener,noreferrer");
    }
  };

  /**
   * Retry loading
   */
  const handleRetry = () => {
    setHasError(false);
    setIframeLoading(true);
  };

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="relative aspect-video bg-surface-primary rounded-lg overflow-hidden">
        <div className="absolute inset-0 skeleton flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // NO VIDEO AVAILABLE
  // ═══════════════════════════════════════════════════════════════════
  if (!embedSrc) {
    return (
      <div className="aspect-video bg-surface-primary rounded-lg flex items-center justify-center">
        <p className="text-foreground-muted">Video not available</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════
  if (hasError) {
    return (
      <div className="aspect-video bg-surface-primary rounded-lg flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-12 h-12 text-accent" />
        <p className="text-foreground-muted text-center">
          Failed to load player. The server might be temporarily unavailable.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={handleRetry} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button onClick={handleOpenInNewTab} className="btn-primary">
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // EMBED PLAYER (IFRAME)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="relative aspect-video bg-surface-primary rounded-lg overflow-hidden">
      {iframeLoading && (
        <div className="absolute inset-0 skeleton flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <iframe
        key={embedSrc}
        src={embedSrc}
        title={`Watch ${title}`}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}

/**
 * Video player wrapper that uses key to reset state when playerKey changes
 */
export function VideoPlayer({ playerKey, ...props }: VideoPlayerProps) {
  const key = playerKey || props.embedSrc || "player";
  return <VideoPlayerInner key={key} {...props} />;
}
