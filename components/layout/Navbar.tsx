"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type Category } from "@/lib/types";

const categories: Category[] = [
  "trending",
  "indonesian-movies",
  "indonesian-drama",
  "kdrama",
  "short-tv",
  "anime",
];

/**
 * Inner navbar content that uses searchParams
 */
function NavbarContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get active category from URL (single source of truth)
  const urlCategory = searchParams.get("category") as Category | null;

  // Determine which category is active
  const getIsActive = (category: Category): boolean => {
    if (pathname !== "/") return false;

    // "trending" is active when no category param or category=trending
    if (category === "trending") {
      return !urlCategory || urlCategory === "trending";
    }

    return urlCategory === category;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    // Close mobile menu
    setIsMenuOpen(false);

    // Navigate - scroll to top handled by Link component with scroll={true}
    if (category === "trending") {
      router.push("/");
    } else {
      router.push(`/?category=${category}`);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
        <nav className="container-main">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight"
              aria-label="NoirFlix Home"
            >
              <Film className="w-7 h-7 text-[var(--accent-primary)]" />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] bg-clip-text text-transparent">
                NoirFlix
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {categories.slice(0, 5).map((category) => {
                const isActive = getIsActive(category);
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
                      isActive
                        ? "text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {CATEGORY_LABELS[category]}
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-red-500"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="search"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  aria-label="Search content"
                />
              </div>
            </form>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black md:hidden"
          >
            <div className="container-main pt-4">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5" />
                </button>
                <input
                  type="search"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-base placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                  aria-label="Search content"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-black border-l border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="font-semibold">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4">
                <ul className="space-y-1">
                  {categories.map((category) => {
                    const isActive = getIsActive(category);
                    return (
                      <li key={category}>
                        <button
                          onClick={() => handleCategoryClick(category)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg transition-colors",
                            isActive
                              ? "bg-red-500/20 text-red-400 border-l-2 border-red-500"
                              : "text-white/60 hover:text-white hover:bg-white/5",
                          )}
                        >
                          {CATEGORY_LABELS[category]}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}

/**
 * Navbar with Suspense boundary for useSearchParams
 */
export function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
          <nav className="container-main">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold tracking-tight"
              >
                <Film className="w-7 h-7 text-[var(--accent-primary)]" />
                <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-gold)] bg-clip-text text-transparent">
                  NoirFlix
                </span>
              </Link>
            </div>
          </nav>
        </header>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
