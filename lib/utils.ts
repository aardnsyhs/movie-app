import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Format rating to one decimal place
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Generate a stable key for list items
 */
export function getContentKey(id: string, index: number): string {
  return `${id}-${index}`;
}

/**
 * Extract the base URL (origin + pathname folder) from any player URL.
 * Example: "https://zeldvorik.ru/apiv3/player.php?id=123" -> "https://zeldvorik.ru/apiv3"
 */
export function getPlayerBaseUrlFromAnyPlayerUrl(playerUrl: string): string {
  try {
    const url = new URL(playerUrl);
    // Get pathname and remove the filename part
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Remove the last part if it looks like a file (has extension)
    if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes(".")) {
      pathParts.pop();
    }
    const basePath = pathParts.length > 0 ? "/" + pathParts.join("/") : "";
    return `${url.origin}${basePath}`;
  } catch {
    // Fallback: just return as-is
    return playerUrl;
  }
}

/**
 * Build a player URL for a specific episode
 */
export interface BuildPlayerUrlParams {
  base: string;
  id: string;
  detailPath: string;
  season?: number;
  episode?: number;
}

export function buildPlayerUrl(params: BuildPlayerUrlParams): string {
  const { base, id, detailPath, season, episode } = params;
  const url = new URL(`${base}/player.php`);
  url.searchParams.set("id", id);
  url.searchParams.set("detailPath", detailPath);
  if (season !== undefined) {
    url.searchParams.set("season", String(season));
  }
  if (episode !== undefined) {
    url.searchParams.set("episode", String(episode));
  }
  return url.toString();
}
