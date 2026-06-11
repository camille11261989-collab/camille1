import About from "./components/About";
import Contact from "./components/Contact";
import CursorExperience from "./components/CursorExperience";
import Expertise from "./components/Expertise";
import FeaturedInsights from "./components/FeaturedInsights";
import GlobalMarketBoard from "./components/GlobalMarketBoard";
import Hero from "./components/Hero";
import Navigation from "./components/Navigation";
import ScrollContinuity from "./components/ScrollContinuity";

export default function App() {
  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <CursorExperience />
      <ScrollContinuity />
      <Navigation />
      <main>
        <Hero />
        <GlobalMarketBoard />
        <About />
        <Expertise />
        <FeaturedInsights />
        <Contact />
      </main>
    </div>
  );
}
