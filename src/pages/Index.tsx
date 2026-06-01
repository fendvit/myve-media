import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ScrollProgress from "@/components/ScrollProgress";
import PartnersMarquee from "@/components/PartnersMarquee";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import PortfolioSection from "@/components/PortfolioSection";
import WhyMeSection from "@/components/WhyMeSection";

// import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
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
        <HeroSection />
        <PartnersMarquee />
        <div className="section-divider relative z-10" />
        <AboutSection />
        <div className="section-divider" />
        <ServicesSection />
        <div className="section-divider" />
        <PortfolioSection />
        <div className="section-divider" />
        <WhyMeSection />
        {/* Testimonials section temporarily removed */}
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
