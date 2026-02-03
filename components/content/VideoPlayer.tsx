"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import {
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldAlert,
  Play,
  Settings,
  Subtitles,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ParsedStreamResponse,
  ParsedDownloadSource,
  ParsedCaption,
} from "@/lib/schemas";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type PlaybackMode = "direct" | "embed-sandboxed" | "external";

interface VideoPlayerProps {
  title: string;
  /** Detail path for fetching stream sources */
  detailPath?: string;
  /** Season number (for TV shows) */
  season?: number;
  /** Episode number (for TV shows) */
  episode?: number;
  /** Embed player URL (iframe src) - fallback only */
  embedSrc?: string;
  isLoading?: boolean;
  /** Unique key to force remount (e.g., `${id}-${season}-${episode}`) */
  playerKey?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Whitelisted domains for embed player (if needed) */
const EMBED_WHITELIST = [
  "zeldvorik.ru",
  // Add other trusted domains here
];

/** Strict sandbox attributes - NO popups, NO top navigation */
const IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-presentation";

// ═══════════════════════════════════════════════════════════════════════════
// STREAM FETCHER
// ═══════════════════════════════════════════════════════════════════════════

async function streamFetcher(url: string): Promise<ParsedStreamResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stream: ${response.status}`);
  }
  return response.json();
}

function buildStreamUrl(
  detailPath: string,
  season?: number,
  episode?: number,
): string {
  let url = `/api/stream?detailPath=${encodeURIComponent(detailPath)}`;
  if (season !== undefined) url += `&season=${season}`;
  if (episode !== undefined) url += `&episode=${episode}`;
  return url;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if embed URL is from whitelisted domain
 */
function isWhitelistedEmbed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return EMBED_WHITELIST.some((domain) => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Get best quality source from downloads array
 */
function getBestSource(
  downloads: ParsedDownloadSource[],
): ParsedDownloadSource | null {
  if (!downloads.length) return null;

  // Sort by resolution/quality descending, pick highest
  const sorted = [...downloads].sort((a, b) => {
    const aRes = a.resolution || a.quality || 0;
    const bRes = b.resolution || b.quality || 0;
    return bRes - aRes;
  });

  return sorted[0];
}

/**
 * Format resolution for display
 */
function formatResolution(source: ParsedDownloadSource): string {
  if (source.resolution) {
    return `${source.resolution}p`;
  }
  if (source.quality) {
    return `${source.quality}p`;
  }
  return "Auto";
}

// ═══════════════════════════════════════════════════════════════════════════
// QUALITY SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function QualitySelector({
  sources,
  currentSource,
  onSelect,
}: {
  sources: ParsedDownloadSource[];
  currentSource: ParsedDownloadSource | null;
  onSelect: (source: ParsedDownloadSource) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (sources.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 text-sm bg-black/60 hover:bg-black/80 rounded transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span>
          {currentSource ? formatResolution(currentSource) : "Quality"}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-surface-primary border border-border-primary rounded-lg shadow-xl overflow-hidden z-20 min-w-[120px]">
            {sources.map((source, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(source);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left hover:bg-surface-hover transition-colors flex items-center justify-between gap-2",
                  currentSource?.url === source.url && "bg-surface-secondary",
                )}
              >
                <span>{formatResolution(source)}</span>
                {currentSource?.url === source.url && (
                  <Check className="w-4 h-4 text-accent" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPTION SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function CaptionSelector({
  captions,
  currentCaption,
  onSelect,
}: {
  captions: ParsedCaption[];
  currentCaption: ParsedCaption | null;
  onSelect: (caption: ParsedCaption | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (captions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-sm rounded transition-colors",
          currentCaption
            ? "bg-accent/80 hover:bg-accent"
            : "bg-black/60 hover:bg-black/80",
        )}
      >
        <Subtitles className="w-4 h-4" />
        <span>{currentCaption?.language || "CC"}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-surface-primary border border-border-primary rounded-lg shadow-xl overflow-hidden z-20 min-w-[140px]">
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-surface-hover transition-colors flex items-center justify-between gap-2",
                !currentCaption && "bg-surface-secondary",
              )}
            >
              <span>Off</span>
              {!currentCaption && <Check className="w-4 h-4 text-accent" />}
            </button>
            {captions.map((caption, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(caption);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left hover:bg-surface-hover transition-colors flex items-center justify-between gap-2",
                  currentCaption?.url === caption.url && "bg-surface-secondary",
                )}
              >
                <span>{caption.language}</span>
                {currentCaption?.url === caption.url && (
                  <Check className="w-4 h-4 text-accent" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ModeSelector({
  mode,
  hasDirectSources,
  hasEmbed,
  onModeChange,
  embedSrc,
}: {
  mode: PlaybackMode;
  hasDirectSources: boolean;
  hasEmbed: boolean;
  onModeChange: (mode: PlaybackMode) => void;
  embedSrc?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {hasDirectSources && (
        <button
          onClick={() => onModeChange("direct")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "direct"
              ? "bg-green-600 text-white"
              : "bg-surface-secondary hover:bg-surface-hover text-foreground-muted",
          )}
        >
          <Shield className="w-4 h-4" />
          Safe Player
        </button>
      )}

      {hasEmbed && (
        <button
          onClick={() => onModeChange("embed-sandboxed")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "embed-sandboxed"
              ? "bg-yellow-600 text-white"
              : "bg-surface-secondary hover:bg-surface-hover text-foreground-muted",
          )}
        >
          <ShieldAlert className="w-4 h-4" />
          Embed (Sandboxed)
        </button>
      )}

      {hasEmbed && embedSrc && (
        <button
          onClick={() => {
            window.open(embedSrc, "_blank", "noopener,noreferrer");
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface-secondary hover:bg-surface-hover text-foreground-muted transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          External (New Tab)
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIRECT VIDEO PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DirectVideoPlayer({
  sources,
  captions,
  title,
  onError,
}: {
  sources: ParsedDownloadSource[];
  captions: ParsedCaption[];
  title: string;
  onError: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSource, setCurrentSource] =
    useState<ParsedDownloadSource | null>(() => getBestSource(sources));
  const [currentCaption, setCurrentCaption] = useState<ParsedCaption | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Update source if sources change
  useEffect(() => {
    const best = getBestSource(sources);
    if (best && best.url !== currentSource?.url) {
      setCurrentSource(best);
      setVideoError(false);
    }
  }, [sources, currentSource?.url]);

  const handleSourceChange = useCallback((source: ParsedDownloadSource) => {
    const video = videoRef.current;
    const currentTime = video?.currentTime || 0;
    const wasPlaying = !video?.paused;

    setCurrentSource(source);
    setVideoError(false);

    // Restore playback position after source change
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    }, 100);
  }, []);

  const handleCaptionChange = useCallback((caption: ParsedCaption | null) => {
    setCurrentCaption(caption);
  }, []);

  const handlePlay = useCallback(() => {
    setHasStarted(true);
    setIsPlaying(true);
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoError(true);
    onError();
  }, [onError]);

  if (!currentSource) {
    return null;
  }

  if (videoError) {
    return (
      <div className="aspect-video bg-surface-primary rounded-lg flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-12 h-12 text-yellow-500" />
        <p className="text-foreground-muted text-center">
          Direct stream blocked or unavailable.
        </p>
        <p className="text-foreground-subtle text-sm text-center">
          The origin server may be blocking direct access. Try the embedded
          player instead.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={hasStarted}
        playsInline
        crossOrigin="anonymous"
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={currentSource.url} type="video/mp4" />
        {/* Captions */}
        {currentCaption && (
          <track
            key={currentCaption.url}
            kind="subtitles"
            src={currentCaption.url}
            srcLang={currentCaption.languageCode || "en"}
            label={currentCaption.language}
            default
          />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Play Overlay (before started) */}
      {!hasStarted && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={handlePlay}
        >
          <div className="w-20 h-20 rounded-full bg-accent/90 flex items-center justify-center hover:bg-accent transition-colors">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Safe Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-green-600/90 rounded text-xs font-medium">
        <Shield className="w-3.5 h-3.5" />
        Safe Player
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-end gap-2">
          <CaptionSelector
            captions={captions}
            currentCaption={currentCaption}
            onSelect={handleCaptionChange}
          />
          <QualitySelector
            sources={sources}
            currentSource={currentSource}
            onSelect={handleSourceChange}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SANDBOXED EMBED PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SandboxedEmbedPlayer({
  embedSrc,
  title,
}: {
  embedSrc: string;
  title: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isWhitelisted = isWhitelistedEmbed(embedSrc);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className="aspect-video bg-surface-primary rounded-lg flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-12 h-12 text-accent" />
        <p className="text-foreground-muted text-center">
          Failed to load embedded player.
        </p>
        <button
          onClick={() => window.open(embedSrc, "_blank", "noopener,noreferrer")}
          className="btn-primary"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-primary z-10">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
        </div>
      )}

      {/* Warning Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 bg-yellow-600/90 rounded text-xs font-medium">
        <ShieldAlert className="w-3.5 h-3.5" />
        Sandboxed Embed
      </div>

      {/* Domain Warning */}
      {!isWhitelisted && (
        <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-red-600/90 rounded text-xs font-medium">
          Untrusted Domain
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
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VIDEO PLAYER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function VideoPlayerInner({
  title,
  detailPath,
  season,
  episode,
  embedSrc,
  isLoading = false,
}: Omit<VideoPlayerProps, "playerKey">) {
  const [mode, setMode] = useState<PlaybackMode>("direct");
  const [directFailed, setDirectFailed] = useState(false);

  // Fetch stream sources via SWR
  const streamUrl = detailPath
    ? buildStreamUrl(detailPath, season, episode)
    : null;
  const { data: streamData, isLoading: streamLoading } =
    useSWR<ParsedStreamResponse>(streamUrl, streamFetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 1,
    });

  const hasDirectSources = (streamData?.downloads?.length ?? 0) > 0;
  const hasCaptions = (streamData?.captions?.length ?? 0) > 0;
  const hasEmbed = !!embedSrc;

  // Auto-switch to embed if direct sources unavailable or failed
  useEffect(() => {
    if (!streamLoading && !hasDirectSources && hasEmbed) {
      setMode("embed-sandboxed");
    }
  }, [streamLoading, hasDirectSources, hasEmbed]);

  useEffect(() => {
    if (directFailed && hasEmbed) {
      setMode("embed-sandboxed");
    }
  }, [directFailed, hasEmbed]);

  const handleDirectError = useCallback(() => {
    setDirectFailed(true);
  }, []);

  const handleModeChange = useCallback(
    (newMode: PlaybackMode) => {
      if (newMode === "external" && embedSrc) {
        window.open(embedSrc, "_blank", "noopener,noreferrer");
        return;
      }
      setMode(newMode);
      if (newMode === "direct") {
        setDirectFailed(false);
      }
    },
    [embedSrc],
  );

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════
  if (isLoading || streamLoading) {
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
  if (!hasDirectSources && !hasEmbed) {
    return (
      <div className="aspect-video bg-surface-primary rounded-lg flex items-center justify-center">
        <p className="text-foreground-muted">Video not available</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER PLAYER BASED ON MODE
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Mode Selector (only show if multiple options available) */}
      {(hasDirectSources || hasEmbed) &&
        (hasDirectSources !== !hasEmbed || directFailed) && (
          <ModeSelector
            mode={mode}
            hasDirectSources={hasDirectSources && !directFailed}
            hasEmbed={hasEmbed}
            onModeChange={handleModeChange}
            embedSrc={embedSrc}
          />
        )}

      {/* Player */}
      {mode === "direct" && hasDirectSources && !directFailed ? (
        <DirectVideoPlayer
          sources={streamData!.downloads}
          captions={streamData?.captions || []}
          title={title}
          onError={handleDirectError}
        />
      ) : mode === "embed-sandboxed" && hasEmbed ? (
        <SandboxedEmbedPlayer embedSrc={embedSrc!} title={title} />
      ) : hasEmbed ? (
        /* Fallback: show buttons to use embed */
        <div className="aspect-video bg-surface-primary rounded-lg flex flex-col items-center justify-center gap-4 px-6">
          <ShieldAlert className="w-12 h-12 text-yellow-500" />
          <p className="text-foreground-muted text-center">
            Direct playback not available.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setMode("embed-sandboxed")}
              className="btn-secondary"
            >
              <ShieldAlert className="w-4 h-4" />
              Use Sandboxed Embed
            </button>
            <button
              onClick={() =>
                window.open(embedSrc!, "_blank", "noopener,noreferrer")
              }
              className="btn-primary"
            >
              <ExternalLink className="w-4 h-4" />
              Open External Player
            </button>
          </div>
        </div>
      ) : null}

      {/* Info Text */}
      {mode === "direct" && hasDirectSources && !directFailed && (
        <p className="text-xs text-foreground-subtle text-center">
          🛡️ Safe Player: No ads, no popups, no redirects
        </p>
      )}
      {mode === "embed-sandboxed" && (
        <p className="text-xs text-yellow-500 text-center">
          ⚠️ Sandboxed: Popups and navigation blocked, but embedded content may
          contain ads
        </p>
      )}
    </div>
  );
}

/**
 * Video player wrapper that uses key to reset state when playerKey changes
 */
export function VideoPlayer({ playerKey, ...props }: VideoPlayerProps) {
  const key =
    playerKey ||
    `${props.detailPath}-${props.season}-${props.episode}` ||
    props.embedSrc ||
    "player";
  return <VideoPlayerInner key={key} {...props} />;
}
