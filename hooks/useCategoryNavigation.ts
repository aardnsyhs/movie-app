"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Category } from "@/lib/types";

/**
 * Valid categories for navigation
 */
const VALID_CATEGORIES: Category[] = [
  "trending",
  "indonesian-movies",
  "indonesian-drama",
  "kdrama",
  "short-tv",
  "anime",
];

/**
 * Hook for category-based navigation using URL searchParams as single source of truth
 *
 * Usage:
 * ```tsx
 * const { activeCategory, setCategory, isHome } = useCategoryNavigation();
 * ```
 */
export function useCategoryNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Get current category from URL
   * Returns null if on home (no category param or invalid)
   */
  const activeCategory = useMemo((): Category | null => {
    // Only read category on home page
    if (pathname !== "/") return null;

    const param = searchParams.get("category");
    if (!param) return null;

    // Validate category
    if (VALID_CATEGORIES.includes(param as Category)) {
      return param as Category;
    }

    return null;
  }, [pathname, searchParams]);

  /**
   * Whether we're on the home page (no specific category)
   */
  const isHome = pathname === "/" && activeCategory === null;

  /**
   * Whether we're showing trending (home or explicit trending)
   */
  const isTrending = isHome || activeCategory === "trending";

  /**
   * Navigate to a category
   * - Updates URL
   * - Scrolls to top
   */
  const setCategory = useCallback(
    (category: Category | null) => {
      if (category === null || category === "trending") {
        // Go to home (no category param)
        router.push("/", { scroll: true });
      } else {
        router.push(`/?category=${category}`, { scroll: true });
      }
    },
    [router],
  );

  /**
   * Check if a category is currently active
   */
  const isCategoryActive = useCallback(
    (category: Category): boolean => {
      if (category === "trending") {
        return isTrending;
      }
      return activeCategory === category;
    },
    [activeCategory, isTrending],
  );

  return {
    activeCategory,
    isHome,
    isTrending,
    setCategory,
    isCategoryActive,
  };
}
