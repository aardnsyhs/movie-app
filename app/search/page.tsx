import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchContent } from "./SearchContent";
import { CardSkeletonGrid } from "@/components";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for movies, series, K-Drama, anime, and more on NoirFlix.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="container-main py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Search</h1>

      <Suspense fallback={<CardSkeletonGrid count={12} />}>
        <SearchContent initialQuery={query} />
      </Suspense>
    </div>
  );
}
