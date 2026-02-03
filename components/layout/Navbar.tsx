"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
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
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category}
                  href={`/?category=${category}`}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === "/"
                      ? "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
                  )}
                >
                  {CATEGORY_LABELS[category]}
                </Link>
              ))}
            </div>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                <input
                  type="search"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                  aria-label="Search content"
                />
              </div>
            </form>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
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
            className="fixed inset-0 z-[60] bg-[var(--background)] md:hidden"
          >
            <div className="container-main pt-4">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-hover)]"
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
                  className="flex-1 px-4 py-3 bg-[var(--surface-primary)] border border-[var(--border)] rounded-lg text-base placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)]"
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
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-[var(--background-elevated)] border-l border-[var(--border)]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <span className="font-semibold">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-hover)]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4">
                <ul className="space-y-1">
                  {categories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/?category=${category}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        {CATEGORY_LABELS[category]}
                      </Link>
                    </li>
                  ))}
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
