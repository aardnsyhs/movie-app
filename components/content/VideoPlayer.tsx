"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface VideoPlayerProps {
  playerUrl?: string;
  title: string;
}

export function VideoPlayer({ playerUrl, title }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!playerUrl) {
    return (
      <div className="aspect-video bg-[var(--surface-primary)] rounded-lg flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Video not available</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="aspect-video bg-[var(--surface-primary)] rounded-lg flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-[var(--accent-primary)]" />
        <p className="text-[var(--foreground-muted)]">Failed to load video</p>
        <button
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
          }}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-[var(--surface-primary)] rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 skeleton flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <iframe
        src={playerUrl}
        title={`Watch ${title}`}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
