"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DetailClientProps {
  description: string;
  detailPath: string;
}

export function DetailClient({ description }: DetailClientProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const shouldTruncate = description.length > 300;
  const displayText =
    !shouldTruncate || isExpanded
      ? description
      : description.slice(0, 300) + "...";

  return (
    <div>
      <p className="text-[var(--foreground-muted)] leading-relaxed">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:underline mt-2"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Read More</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
