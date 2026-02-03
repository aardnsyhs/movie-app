"use client";

import { useState, useRef } from "react";
import {
  AlertCircle,
  RefreshCw,
  Settings,
  Download,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import type { ParsedDownloadSource, ParsedCaption } from "@/lib/schemas";

interface VideoPlayerProps {
  title: string;
  playerUrl?: string; // Fallback iframe URL
  downloads?: ParsedDownloadSource[];
  captions?: ParsedCaption[];
  isLoading?: boolean;
  /** Unique key to force iframe remount (e.g., `${id}-${season}-${episode}`) */
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
 * Inner player component that resets state when key changes
 */
function VideoPlayerInner({
  title,
  playerUrl,
  downloads,
  captions,
  isLoading = false,
}: Omit<VideoPlayerProps, "playerKey">) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(0);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  const sortedDownloads = downloads ? sortByQuality(downloads) : [];
  const hasDirectMP4 = sortedDownloads.length > 0 && !useIframeFallback;
  const currentSource = sortedDownloads[selectedQualityIndex];

  // VTT captions for <track>
  const vttCaptions = captions?.filter((c) => isVttCaption(c.url)) || [];
  // SRT captions (show as download links)
  const srtCaptions = captions?.filter((c) => !isVttCaption(c.url)) || [];

  // Handle iframe error
  const handleIframeError = () => {
    setIframeLoading(false);
    setHasError(true);
  };

  // Open player in new tab
  const handleOpenInNewTab = () => {
    if (playerUrl) {
      window.open(playerUrl, "_blank", "noopener,noreferrer");
    }
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

    // Restore playback position after source change
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

  // Loading state
  if (isLoading) {
    return (
      <div className="relative aspect-video bg-[var(--surface-primary)] rounded-lg overflow-hidden">
        <div className="absolute inset-0 skeleton flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // No video available
  if (!hasDirectMP4 && !playerUrl) {
    return (
      <div className="aspect-video bg-[var(--surface-primary)] rounded-lg flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Video not available</p>
      </div>
    );
  }

  // Error state (for MP4)
  if (hasError && hasDirectMP4) {
    return (
      <div className="aspect-video bg-[var(--surface-primary)] rounded-lg flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-[var(--accent-primary)]" />
        <p className="text-[var(--foreground-muted)]">Failed to load video</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setHasError(false);
            }}
            className="btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          {playerUrl && (
            <button
              onClick={() => setUseIframeFallback(true)}
              className="btn-primary"
            >
              Use Embed Player
            </button>
          )}
        </div>
      </div>
    );
  }

  // Native video player with MP4
  if (hasDirectMP4 && currentSource) {
    return (
      <div className="space-y-3">
        {/* Video Container */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            key={currentSource.url}
            src={currentSource.url}
            className="w-full h-full"
            controls
            playsInline
            onError={() => setHasError(true)}
          >
            {/* VTT Subtitles */}
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

          {/* Quality Selector Button */}
          {sortedDownloads.length > 1 && (
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

                {/* Quality Menu */}
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
        </div>

        {/* SRT Subtitles as Download Links */}
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

        {/* Fallback to iframe option */}
        {playerUrl && (
          <div className="text-center">
            <button
              onClick={() => setUseIframeFallback(true)}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline"
            >
              Having issues? Try embed player
            </button>
          </div>
        )}
      </div>
    );
  }

  // Iframe fallback
  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-[var(--surface-primary)] rounded-lg overflow-hidden">
        {iframeLoading && (
          <div className="absolute inset-0 skeleton flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--surface-primary)]">
            <AlertCircle className="w-12 h-12 text-[var(--accent-primary)]" />
            <p className="text-[var(--foreground-muted)] text-center px-4">
              Failed to load player
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setHasError(false);
                  setIframeLoading(true);
                }}
                className="btn-secondary"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Player
              </button>
              {playerUrl && (
                <button onClick={handleOpenInNewTab} className="btn-primary">
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              )}
            </div>
          </div>
        ) : (
          <iframe
            src={playerUrl}
            title={`Watch ${title}`}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            onLoad={() => setIframeLoading(false)}
            onError={handleIframeError}
          />
        )}
      </div>

      {/* Switch back to direct player */}
      {sortedDownloads.length > 0 && useIframeFallback && (
        <div className="text-center">
          <button
            onClick={() => setUseIframeFallback(false)}
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline"
          >
            Switch to direct player
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
  // Use playerKey to force remount the inner component
  // This ensures all state is reset when episode changes
  const key = playerKey || props.playerUrl || "player";

  return <VideoPlayerInner key={key} {...props} />;
}
