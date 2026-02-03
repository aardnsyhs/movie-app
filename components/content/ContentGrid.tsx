"use client";

import { ContentCard } from "./ContentCard";
import { CardSkeletonGrid } from "./CardSkeleton";
import type { ContentItem } from "@/lib/types";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ContentGridProps {
  items: ContentItem[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyMessage?: string;
}

export function ContentGrid({
  items,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = "No content found",
}: ContentGridProps) {
  // Loading state
  if (isLoading && items.length === 0) {
    return <CardSkeletonGrid count={12} />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--accent-primary)] mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load content</h3>
        <p className="text-[var(--foreground-muted)] mb-4">
          Something went wrong. Please try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-secondary"
            aria-label="Retry loading content"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-[var(--foreground-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {items.map((item, index) => (
        <ContentCard
          key={`${item.id}-${index}`}
          item={item}
          index={index}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
