import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl md:text-8xl font-bold text-[var(--accent-primary)] mb-4">
        404
      </h1>
      <h2 className="text-xl md:text-2xl font-semibold mb-2">
        Content Not Found
      </h2>
      <p className="text-[var(--foreground-muted)] mb-8 max-w-md">
        The movie or series you&apos;re looking for doesn&apos;t exist or may
        have been removed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          <Home className="w-4 h-4" />
          Go Home
        </Link>
        <Link href="/search" className="btn-secondary">
          <Search className="w-4 h-4" />
          Search Content
        </Link>
      </div>
    </div>
  );
}
