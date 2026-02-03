import { NextRequest, NextResponse } from "next/server";
import { APIDetailResponseSchema } from "@/lib/schemas";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://zeldvorik.ru/apiv3/api.php";

/** Timeout for upstream API requests (8 seconds) */
const UPSTREAM_TIMEOUT_MS = 8000;

/**
 * GET /api/detail?detailPath=...
 *
 * Proxies detail requests to upstream API with:
 * - AbortController timeout (8s)
 * - Edge caching headers
 * - Zod validation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailPath = searchParams.get("detailPath");

  if (!detailPath) {
    return NextResponse.json(
      { success: false, error: "Missing detailPath parameter" },
      { status: 400 },
    );
  }

  const upstreamUrl = `${API_BASE_URL}?action=detail&detailPath=${encodeURIComponent(detailPath)}`;

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
      return NextResponse.json(
        { success: false, error: `Upstream error: ${response.status}` },
        {
          status: response.status,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const json = await response.json();

    // Validate with Zod
    const parsed = APIDetailResponseSchema.parse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        {
          status: 404,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }

    // Success - return with aggressive caching
    return NextResponse.json(parsed, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Request timeout - upstream API too slow" },
        {
          status: 504,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
