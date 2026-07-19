import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroOrbit from "@/components/HeroOrbit";
import ScrollProgress from "@/components/ScrollProgress";
import StatsStrip from "@/components/StatsStrip";
import PartnersMarquee from "@/components/PartnersMarquee";
import PillarsSection from "@/components/PillarsSection";
import WorkSection from "@/components/WorkSection";
import FinaleSection from "@/components/FinaleSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

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
      <Seo
        title="MYVE — Weby, aplikace a software na míru"
        description="Studio MYVE tvoří moderní weby, webové aplikace a software na míru. Making You Visible Everywhere."
        path="/"
      />
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroOrbit />
        <StatsStrip />
        <PartnersMarquee />
        <PillarsSection />
        <WorkSection />
        <FinaleSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
