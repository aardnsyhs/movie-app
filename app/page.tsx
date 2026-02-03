import { Suspense } from "react";
import {
  fetchTrending,
  fetchIndonesianMovies,
  fetchIndonesianDrama,
  fetchKDrama,
  fetchShortTV,
  fetchAnime,
} from "@/lib/api";
import {
  HeroSlider,
  ContentRail,
  RailSkeleton,
  HeroSkeleton,
} from "@/components";
import { HomeContent } from "./HomeContent";

export const revalidate = 300; // Revalidate every 5 minutes

async function getHomeData() {
  const [trending, indonesianMovies, indonesianDrama, kdrama, shortTV, anime] =
    await Promise.all([
      fetchTrending().catch(() => ({
        success: false,
        items: [],
        page: 1,
        hasMore: false,
      })),
      fetchIndonesianMovies().catch(() => ({
        success: false,
        items: [],
        page: 1,
        hasMore: false,
      })),
      fetchIndonesianDrama().catch(() => ({
        success: false,
        items: [],
        page: 1,
        hasMore: false,
      })),
      fetchKDrama().catch(() => ({
        success: false,
        items: [],
        page: 1,
        hasMore: false,
      })),
      fetchShortTV().catch(() => ({
        success: false,
        items: [],
        page: 1,
        hasMore: false,
      })),
      fetchAnime().catch(() => ({
        success: false,
        items: [],
        page: 1,
        hasMore: false,
      })),
    ]);

  return {
    trending,
    indonesianMovies,
    indonesianDrama,
    kdrama,
    shortTV,
    anime,
  };
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      {/* Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSlider items={data.trending.items} />
      </Suspense>

      {/* Content Rails */}
      <div className="container-main space-y-2">
        <Suspense fallback={<RailSkeleton />}>
          <ContentRail title="Trending Now" items={data.trending.items} />
        </Suspense>

        <Suspense fallback={<RailSkeleton />}>
          <ContentRail
            title="Film Indonesia"
            items={data.indonesianMovies.items}
          />
        </Suspense>

        <Suspense fallback={<RailSkeleton />}>
          <ContentRail
            title="Drama Indonesia"
            items={data.indonesianDrama.items}
          />
        </Suspense>

        <Suspense fallback={<RailSkeleton />}>
          <ContentRail title="K-Drama" items={data.kdrama.items} />
        </Suspense>

        <Suspense fallback={<RailSkeleton />}>
          <ContentRail title="Short TV" items={data.shortTV.items} />
        </Suspense>

        <Suspense fallback={<RailSkeleton />}>
          <ContentRail title="Anime" items={data.anime.items} />
        </Suspense>
      </div>

      {/* Category Grid Section (Client Component) */}
      <Suspense
        fallback={
          <div className="container-main py-8">
            <RailSkeleton />
          </div>
        }
      >
        <HomeContent initialData={data} />
      </Suspense>
    </>
  );
}
