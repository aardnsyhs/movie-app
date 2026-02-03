# NoirFlix - Premium Streaming Web App

A production-ready streaming web application built with Next.js, featuring a premium dark theme UI inspired by Netflix and Disney+.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Data Fetching**: SWR
- **Validation**: Zod
- **Icons**: Lucide React

## Features

- 🎬 **Hero Slider** - Animated carousel for trending content
- 📱 **Responsive Design** - Mobile-first approach with premium dark theme
- 🔍 **Search** - Debounced search with real-time results
- 📺 **Content Rails** - Horizontal scrollable content sections
- 🎥 **Video Player** - Embedded player with error handling
- ♾️ **Infinite Scroll** - Load more content seamlessly
- 📋 **Watchlist** - Local storage-based watchlist
- 🎯 **SEO Optimized** - Dynamic metadata for all pages

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd movie-app

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=https://zeldvorik.ru/apiv3/api.php
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### Build

```bash
# Create production build
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
movie-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with navbar/footer
│   ├── page.tsx            # Home page
│   ├── HomeContent.tsx     # Client-side category grid
│   ├── globals.css         # Premium dark theme styles
│   ├── search/             # Search page
│   └── title/[...detailPath]/  # Detail page
├── components/
│   ├── layout/             # Navbar, Footer
│   └── content/            # ContentCard, Grid, Rail, Hero
├── lib/
│   ├── api.ts              # API client functions
│   ├── schemas.ts          # Zod validation schemas
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Utility functions
├── hooks/
│   ├── useDebounce.ts      # Debounce hook
│   ├── useInfiniteScroll.ts # Intersection Observer hook
│   └── useWatchlist.ts     # LocalStorage watchlist hook
└── public/                 # Static assets
```

## API Endpoints

| Endpoint        | Action                             |
| --------------- | ---------------------------------- |
| Trending        | `?action=trending&page=1`          |
| Film Indonesia  | `?action=indonesian-movies&page=1` |
| Drama Indonesia | `?action=indonesian-drama&page=1`  |
| K-Drama         | `?action=kdrama&page=1`            |
| Short TV        | `?action=short-tv&page=1`          |
| Anime           | `?action=anime&page=1`             |
| Search          | `?action=search&q={query}`         |
| Detail          | `?action=detail&detailPath={path}` |

## License

MIT
