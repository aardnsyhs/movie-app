import { Suspense } from "react";
import { HeroSlider, RailSkeleton } from "@/components";
import { HomeRails } from "./HomeRails";
import { fetchTrendingServer } from "@/lib/api";

/**
 * Server Component - Hero data fetched server-side for instant render
 * Rails streamed via Suspense for progressive loading
 */
export default async function HomePage() {
  // Server-side fetch with caching (5 min)
  // This makes hero render immediately with no loading state
  let heroData;
  try {
    heroData = await fetchTrendingServer(1);
  } catch {
    // Fallback: render empty hero on error
    heroData = { success: false, items: [], page: 1, hasMore: false };
  }

  return (
    <>
      {/* Hero - Server-rendered, instant */}
      {heroData.items.length > 0 ? (
        <HeroSlider items={heroData.items} />
      ) : (
        <div className="h-[60vh] min-h-[400px] max-h-[700px] -mt-16 mb-8 bg-gradient-to-b from-white/5 to-transparent" />
      )}

      {/* Content Rails - Streamed via Suspense */}
      <Suspense
        fallback={
          <div className="container-main space-y-2">
            <RailSkeleton />
            <RailSkeleton />
            <RailSkeleton />
          </div>
        }
      >
        <HomeRails />
      </Suspense>
    </>
  );
}
