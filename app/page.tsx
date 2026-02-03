import { HomeClient } from "./HomeClient";

// No SSR data fetching - renders instantly with skeleton
// Data is fetched client-side with SWR for fast initial render

export default function HomePage() {
  return <HomeClient />;
}
