import { NextRequest, NextResponse } from "next/server";
import { StreamResponseSchema } from "@/lib/schemas";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://zeldvorik.ru/apiv3/api.php";

/** Timeout for upstream API requests (8 seconds) */
const UPSTREAM_TIMEOUT_MS = 8000;

/**
 * GET /api/stream?detailPath=...&season=...&episode=...
 *
 * Fetches direct stream sources (mp4 downloads + captions) from upstream API.
 * Returns structured response with:
 * - downloads[]: Array of { url, resolution, quality }
 * - captions[]: Array of { language, url, languageCode }
 *
 * Features:
 * - AbortController timeout (8s)
 * - Edge caching headers
 * - Zod validation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailPath = searchParams.get("detailPath");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!detailPath) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing detailPath parameter",
        downloads: [],
        captions: [],
      },
      { status: 400 },
    );
  }

  // Build upstream URL for stream sources
  let upstreamUrl = `${API_BASE_URL}?action=stream&detailPath=${encodeURIComponent(detailPath)}`;
  if (season) upstreamUrl += `&season=${encodeURIComponent(season)}`;
  if (episode) upstreamUrl += `&episode=${encodeURIComponent(episode)}`;

  // AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Return empty but valid response on upstream error
      return NextResponse.json(
        {
          success: false,
          error: `Upstream error: ${response.status}`,
          downloads: [],
          captions: [],
        },
        {
          status: 200, // Return 200 so client can handle gracefully
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const json = await response.json();

    // Validate with Zod (with safe fallbacks)
    const parsed = StreamResponseSchema.parse(json);

    // Success - return with caching
    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Request timeout"
          : error.message
        : "Unknown error";

    // Return empty but valid response on error
    return NextResponse.json(
      {
        success: false,
        error: message,
        downloads: [],
        captions: [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
