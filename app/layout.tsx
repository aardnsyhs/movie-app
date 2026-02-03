import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "NoirFlix - Stream Movies & Series",
    template: "%s | NoirFlix",
  },
  description:
    "Discover and stream the latest movies, K-Drama, anime, and Indonesian film & drama. Premium streaming experience with NoirFlix.",
  keywords: [
    "streaming",
    "movies",
    "series",
    "kdrama",
    "anime",
    "indonesian movies",
    "film indonesia",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "NoirFlix",
    title: "NoirFlix - Stream Movies & Series",
    description:
      "Discover and stream the latest movies, K-Drama, anime, and Indonesian film & drama.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoirFlix - Stream Movies & Series",
    description:
      "Discover and stream the latest movies, K-Drama, anime, and Indonesian film & drama.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
