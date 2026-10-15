import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroOrbit from "@/components/HeroOrbit";
import ScrollProgress from "@/components/ScrollProgress";
import StatsStrip from "@/components/StatsStrip";
import PartnersMarquee from "@/components/PartnersMarquee";
import PillarsSection from "@/components/PillarsSection";
import WorkSection from "@/components/WorkSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FinaleSection from "@/components/FinaleSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import ServicesLinks from "@/components/ServicesLinks";
import { PAGES } from "@/seo/content";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Seo title={PAGES.home.title} description={PAGES.home.description} path="/" />
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroOrbit />
        <PartnersMarquee />
        <WorkSection />
        <TestimonialsSection />
        <StatsStrip />
        <PillarsSection />
        <ServicesLinks />
        <FinaleSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
