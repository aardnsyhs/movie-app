"use client";

import { useState, useRef, useCallback } from "react";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  MousePointerClick,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface VideoPlayerProps {
  title: string;
  /** Embed player URL (iframe src) - from API playerUrl field */
  embedSrc?: string;
  isLoading?: boolean;
  /** Unique key to force remount (e.g., `${id}-${season}-${episode}`) */
  playerKey?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Strict sandbox attributes:
 * - allow-scripts: Required for player to work
 * - allow-same-origin: Required for player's internal scripts
 * - allow-presentation: For fullscreen API
 *
 * INTENTIONALLY EXCLUDED (security):
 * - allow-popups: Prevents window.open() / popunders
 * - allow-top-navigation: Prevents top-level redirects
 * - allow-top-navigation-by-user-activation: Prevents click-hijack redirects
 */
const IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-presentation";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VIDEO PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function VideoPlayerInner({
  title,
  embedSrc,
  isLoading = false,
}: Omit<VideoPlayerProps, "playerKey">) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Loading & error states
  const [iframeLoading, setIframeLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Click guard state - blocks first click to prevent popunder on initial interaction
  const [clickGuardActive, setClickGuardActive] = useState(true);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeLoading(false);
    setHasError(true);
  }, []);

  /**
   * Handle click guard - disables after first click
   * This catches the "first click popunder" trick used by some ad networks
   */
  const handleClickGuard = useCallback(() => {
    setClickGuardActive(false);
  }, []);

  /**
   * Open embed in new tab as fallback
   */
  const handleOpenExternal = useCallback(() => {
    if (embedSrc) {
      window.open(embedSrc, "_blank", "noopener,noreferrer");
    }
  }, [embedSrc]);

  /**
   * Retry loading iframe
   */
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIframeLoading(true);
    // Force iframe reload by toggling key
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
        }
      }, 100);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE (from parent)
  // ═══════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="relative aspect-video bg-surface-primary rounded-lg overflow-hidden">
        <div className="absolute inset-0 skeleton flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
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
            <AlertCircle className="w-4 h-4" />
            Try Again
          </button>
          <button onClick={handleOpenExternal} className="btn-primary">
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SANDBOXED EMBED PLAYER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-2">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {/* Loading Spinner */}
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary z-10">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
          </div>
        )}

        {/* Security Badge */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2 py-1 bg-green-600/90 rounded text-xs font-medium text-white">
          <ShieldCheck className="w-3.5 h-3.5" />
          Protected
        </div>

        {/* Click Guard Overlay - catches first click to prevent popunder */}
        {clickGuardActive && !iframeLoading && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/60 transition-opacity hover:bg-black/40"
            onClick={handleClickGuard}
          >
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="w-20 h-20 rounded-full bg-accent/90 flex items-center justify-center hover:bg-accent transition-colors">
                <MousePointerClick className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium">Click to Enable Player</p>
              <p className="text-xs text-white/70 max-w-xs text-center">
                First click is blocked to prevent unwanted popups
              </p>
            </div>
          </div>
        )}

        {/* Sandboxed Iframe */}
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title={`Watch ${title}`}
          className="absolute inset-0 w-full h-full"
          sandbox={IFRAME_SANDBOX}
          referrerPolicy="no-referrer"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>

      {/* Info & Fallback */}
      <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          Popups & redirects blocked
        </span>
        <button
          onClick={handleOpenExternal}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in New Tab
        </button>
      </div>
    </div>
  );
}

/**
 * Video player wrapper that uses key to reset state when playerKey changes
 *
 * Usage:
 * <VideoPlayer
 *   title="Movie Title"
 *   embedSrc={detail.playerUrl}  // Use playerUrl directly from API
 *   playerKey={`${contentId}-${season}-${episode}`}
 * />
 */
export function VideoPlayer({ playerKey, ...props }: VideoPlayerProps) {
  const key = playerKey || props.embedSrc || "player";
  return <VideoPlayerInner key={key} {...props} />;
}
