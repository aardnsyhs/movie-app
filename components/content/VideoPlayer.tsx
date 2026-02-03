"use client";

import { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  RefreshCw,
  Settings,
  Download,
  ChevronDown,
  ExternalLink,
  Play,
  Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedDownloadSource, ParsedCaption } from "@/lib/schemas";

/** Playback mode: embed (iframe) or direct (video element) */
export type PlaybackMode = "embed" | "direct";

interface VideoPlayerProps {
  title: string;
  /** Embed player URL (iframe src) - primary/reliable source */
  embedSrc?: string;
  /** Direct MP4 URLs - optional, may fail with 403 */
  directSources?: ParsedDownloadSource[];
  captions?: ParsedCaption[];
  isLoading?: boolean;
  /** Current playback mode */
  mode?: PlaybackMode;
  /** Callback when mode should change (e.g., direct failed → embed) */
  onModeChange?: (mode: PlaybackMode) => void;
  /** Unique key to force remount (e.g., `${id}-${season}-${episode}`) */
  playerKey?: string;
}

/**
 * Get quality label from resolution
 */
function getQualityLabel(source: ParsedDownloadSource): string {
  const quality = source.quality || source.resolution || 0;
  return quality ? `${quality}p` : "Default";
}

/**
 * Sort downloads by quality (highest first)
 */
function sortByQuality(
  downloads: ParsedDownloadSource[],
): ParsedDownloadSource[] {
  return [...downloads].sort((a, b) => {
    const aQ = a.quality || a.resolution || 0;
    const bQ = b.quality || b.resolution || 0;
    return bQ - aQ;
  });
}

/**
 * Check if caption URL is VTT format (browser-compatible)
 */
function isVttCaption(url: string): boolean {
  return url.toLowerCase().endsWith(".vtt");
}

/**
 * Toast notification for mode switch
 */
function ModeSwithToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-4 left-4 right-4 z-20 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 shadow-lg"
    >
      <p className="text-sm text-[var(--foreground-muted)]">{message}</p>
    </motion.div>
  );
}

/**
 * Inner player component that handles the actual playback
 */
function VideoPlayerInner({
  title,
  embedSrc,
  directSources,
  captions,
  isLoading = false,
  mode = "embed",
  onModeChange,
}: Omit<VideoPlayerProps, "playerKey">) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI states
  const [hasError, setHasError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [directFailedOnce, setDirectFailedOnce] = useState(false);

  const sortedDownloads = directSources ? sortByQuality(directSources) : [];
  const hasDirectSources = sortedDownloads.length > 0;
  const currentSource = sortedDownloads[selectedQualityIndex];

  // VTT captions for <track>
  const vttCaptions = captions?.filter((c) => isVttCaption(c.url)) || [];
  // SRT captions (show as download links)
  const srtCaptions = captions?.filter((c) => !isVttCaption(c.url)) || [];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (iframeTimeoutRef.current) {
        clearTimeout(iframeTimeoutRef.current);
      }
    };
  }, []);

  // Setup iframe load timeout (10s)
  useEffect(() => {
    if (mode === "embed" && iframeLoading && embedSrc) {
      iframeTimeoutRef.current = setTimeout(() => {
        if (iframeLoading) {
          setHasError(true);
          setIframeLoading(false);
        }
      }, 10000);

      return () => {
        if (iframeTimeoutRef.current) {
          clearTimeout(iframeTimeoutRef.current);
        }
      };
    }
  }, [mode, iframeLoading, embedSrc]);

  /**
   * Handle direct video error - auto fallback to embed
   */
  const handleVideoError = () => {
    setVideoLoading(false);
    setDirectFailedOnce(true);

    if (embedSrc && onModeChange) {
      setToastMessage("Direct video blocked by CDN. Switched to embed player.");
      onModeChange("embed");
    } else {
      setHasError(true);
    }
  };

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
    if (mode === "embed") {
      setIframeLoading(true);
    } else {
      setVideoLoading(true);
    }
  };

  /**
   * Switch to embed mode
   */
  const handleSwitchToEmbed = () => {
    setHasError(false);
    setIframeLoading(true);
    onModeChange?.("embed");
  };

  /**
   * Switch to direct mode (beta)
   */
  const handleSwitchToDirect = () => {
    if (!hasDirectSources) return;
    setHasError(false);
    setVideoLoading(true);
    onModeChange?.("direct");
  };

  /**
   * Handle quality switch while preserving playback time
   */
  const handleQualityChange = (index: number) => {
    const video = videoRef.current;
    const currentTime = video?.currentTime || 0;
    const wasPlaying = video && !video.paused;

    setSelectedQualityIndex(index);
    setShowQualityMenu(false);

    setTimeout(() => {
      const newVideo = videoRef.current;
      if (newVideo) {
        newVideo.currentTime = currentTime;
        if (wasPlaying) {
          newVideo.play().catch(() => {});
        }
      }
    }, 100);
  };

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="relative aspect-video bg-[var(--surface-primary)] rounded-lg overflow-hidden">
        <div className="absolute inset-0 skeleton flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // NO VIDEO AVAILABLE
  // ═══════════════════════════════════════════════════════════════════
  if (!embedSrc && !hasDirectSources) {
    return (
      <div className="aspect-video bg-[var(--surface-primary)] rounded-lg flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Video not available</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════
  if (hasError) {
    const isDirectError = mode === "direct";

    return (
      <div className="aspect-video bg-[var(--surface-primary)] rounded-lg flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-12 h-12 text-[var(--accent-primary)]" />
        <p className="text-[var(--foreground-muted)] text-center">
          {isDirectError
            ? "This video host blocks direct playback in some browsers."
            : "Failed to load player"}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={handleRetry} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          {isDirectError && embedSrc && (
            <button onClick={handleSwitchToEmbed} className="btn-primary">
              <Monitor className="w-4 h-4" />
              Use Embed Player
            </button>
          )}
          {!isDirectError && embedSrc && (
            <button onClick={handleOpenInNewTab} className="btn-primary">
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
          )}
          {!isDirectError && hasDirectSources && !directFailedOnce && (
            <button onClick={handleSwitchToDirect} className="btn-secondary">
              <Play className="w-4 h-4" />
              Try Direct (Beta)
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // DIRECT MODE (VIDEO ELEMENT)
  // ═══════════════════════════════════════════════════════════════════
  if (mode === "direct" && hasDirectSources && currentSource) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {videoLoading && (
            <div className="absolute inset-0 skeleton flex items-center justify-center z-10">
              <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <video
            ref={videoRef}
            key={currentSource.url}
            src={currentSource.url}
            className="w-full h-full"
            controls
            playsInline
            onCanPlay={() => setVideoLoading(false)}
            onError={handleVideoError}
          >
            {vttCaptions.map((caption, i) => (
              <track
                key={i}
                kind="subtitles"
                src={caption.url}
                srcLang={caption.languageCode || "en"}
                label={caption.language}
                default={i === 0}
              />
            ))}
          </video>

          {/* Quality Selector */}
          {sortedDownloads.length > 1 && !videoLoading && (
            <div className="absolute bottom-16 right-4">
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white text-sm rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {getQualityLabel(currentSource)}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-xl overflow-hidden min-w-[120px]">
                    {sortedDownloads.map((source, index) => (
                      <button
                        key={index}
                        onClick={() => handleQualityChange(index)}
                        className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                          index === selectedQualityIndex
                            ? "bg-[var(--accent-primary)] text-white"
                            : "hover:bg-[var(--surface-hover)]"
                        }`}
                      >
                        {getQualityLabel(source)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toast notification */}
          <AnimatePresence>
            {toastMessage && (
              <ModeSwithToast
                message={toastMessage}
                onClose={() => setToastMessage(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* SRT Subtitles */}
        {srtCaptions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-[var(--foreground-muted)]">
              Subtitles:
            </span>
            {srtCaptions.map((caption, i) => (
              <a
                key={i}
                href={caption.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] rounded transition-colors"
              >
                <Download className="w-3 h-3" />
                {caption.language}
              </a>
            ))}
          </div>
        )}

        {/* Switch to embed option */}
        {embedSrc && (
          <div className="text-center">
            <button
              onClick={handleSwitchToEmbed}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline"
            >
              Having issues? Use embed player
            </button>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // EMBED MODE (IFRAME) - DEFAULT
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-[var(--surface-primary)] rounded-lg overflow-hidden">
        {iframeLoading && (
          <div className="absolute inset-0 skeleton flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {embedSrc && (
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
        )}

        {/* Toast notification */}
        <AnimatePresence>
          {toastMessage && (
            <ModeSwithToast
              message={toastMessage}
              onClose={() => setToastMessage(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Direct player option (Beta) - only show if not failed before */}
      {hasDirectSources && !directFailedOnce && (
        <div className="text-center">
          <button
            onClick={handleSwitchToDirect}
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline"
          >
            Try direct video (Beta)
          </button>
        </div>
      )}
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
