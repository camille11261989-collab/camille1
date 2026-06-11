import AnalyticsDashboard from "./components/AnalyticsDashboard";
import About from "./components/About";
import Contact from "./components/Contact";
import CursorExperience from "./components/CursorExperience";
import Expertise from "./components/Expertise";
import FeaturedInsights from "./components/FeaturedInsights";
import Hero from "./components/Hero";
import MarketTicker from "./components/MarketTicker";
import Navigation from "./components/Navigation";
import ScrollContinuity from "./components/ScrollContinuity";
import { useEngagementTracking } from "./services/analytics";

export default function App() {
  const isAdminRoute = ["/admin/analytics", "/dashboard"].includes(window.location.pathname);
  useEngagementTracking(!isAdminRoute);

  if (isAdminRoute) {
    return <AnalyticsDashboard />;
  }

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <CursorExperience />
      <ScrollContinuity />
      <Navigation />
      <main>
        <Hero />
        <MarketTicker />
        <About />
        <Expertise />
        <FeaturedInsights />
        <Contact />
      </main>
    </div>
  );
}
