import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_API_BASE = "https://zeldvorik.ru/apiv3/api.php";
const TIMEOUT_MS = 8000;

/**
 * Centralized API Proxy
 *
 * All external API calls go through this route to:
 * - Eliminate CORS issues
 * - Add consistent timeout handling
 * - Enable server-side caching
 * - Normalize error responses
 *
 * Usage: /api/proxy?action=trending&page=1
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build external URL from query params
  const externalUrl = new URL(EXTERNAL_API_BASE);
  searchParams.forEach((value, key) => {
    externalUrl.searchParams.set(key, value);
  });

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(externalUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "NoirFlix/1.0",
      },
      // Server-side cache for 5 minutes
      next: { revalidate: 300 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Upstream API error: ${response.status}`,
          status: response.status,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Return with cache headers
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout - external API took too long",
          status: 504,
        },
        { status: 504 },
      );
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
        status: 500,
      },
      { status: 500 },
    );
  }
}

/**
 * Handle POST requests (for future use, e.g., search)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const externalUrl = new URL(EXTERNAL_API_BASE);

    // Add body params to URL
    Object.entries(body).forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "number") {
        externalUrl.searchParams.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(externalUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "NoirFlix/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `API error: ${response.status}` },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
