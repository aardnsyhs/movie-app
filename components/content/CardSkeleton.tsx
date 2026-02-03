export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-lg skeleton" />
      <div className="mt-2 h-4 w-3/4 rounded skeleton" />
    </div>
  );
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-40 rounded skeleton mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-36 md:w-44">
            <div className="aspect-[2/3] rounded-lg skeleton" />
            <div className="mt-2 h-4 w-3/4 rounded skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[60vh] min-h-[400px] max-h-[700px] animate-pulse">
      <div className="absolute inset-0 skeleton" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 space-y-4">
        <div className="h-10 w-2/3 max-w-md rounded skeleton" />
        <div className="h-4 w-1/3 max-w-xs rounded skeleton" />
        <div className="flex gap-3 pt-4">
          <div className="h-12 w-32 rounded-lg skeleton" />
          <div className="h-12 w-32 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}
