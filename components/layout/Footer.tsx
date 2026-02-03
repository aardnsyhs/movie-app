import { Film } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background-elevated)]">
      <div className="container-main py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold"
            aria-label="NoirFlix Home"
          >
            <Film className="w-5 h-5 text-[var(--accent-primary)]" />
            <span className="text-[var(--foreground-muted)]">NoirFlix</span>
          </Link>

          <p className="text-sm text-[var(--foreground-subtle)]">
            © {currentYear} NoirFlix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
