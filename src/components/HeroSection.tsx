import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import GradientRimButton from "@/components/ui/GradientRimButton";
import MagneticButton from "@/components/ui/MagneticButton";
import FloatingShapes from "@/components/ui/FloatingShapes";
import { TextRotate } from "@/components/ui/text-rotate";
import Floating, { FloatingElement } from "@/components/ui/parallax-floating";
import { useRef, useCallback } from "react";
import mockupGarvys from "@/assets/mockup-garvys.png";
import mockupZabava from "@/assets/mockup-zabava.png";
import mockupSportAcademy from "@/assets/mockup-sport-academy.png";
import mockupUltraquestWeb from "@/assets/mockup-ultraquest-web.png";

const MOCKUP_PROJECTS = [
  { src: mockupGarvys, alt: "Projekt GARVYS — web", className: "w-[220px] lg:w-[300px] h-auto", width: 1920, height: 1875 },
  { src: mockupSportAcademy, alt: "Projekt Sport Academy — mobilní aplikace", className: "w-[120px] lg:w-[160px] h-auto", width: 1536, height: 1920 },
  { src: mockupZabava, alt: "Projekt Zábava za školou — web", className: "w-[240px] lg:w-[320px] h-auto", width: 1920, height: 1142 },
  { src: mockupUltraquestWeb, alt: "Projekt UltraQuest — web", className: "w-[120px] lg:w-[160px] h-auto", width: 1536, height: 1920 },
];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!glowRef.current || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
    glowRef.current.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20 lg:pt-24"
      style={{ background: "var(--gradient-hero)" }}
    >
      <FloatingShapes variant="hero" />

      {/* Cursor glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute top-0 left-0 w-[400px] h-[400px] rounded-full opacity-0 transition-opacity duration-300 z-0"
        style={{
          background: "radial-gradient(circle, hsl(12 85% 62% / 0.08) 0%, transparent 70%)",
        }}
      />

      <Floating sensitivity={1} easingFactor={0.04} className="w-full">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          {/* Centered text content */}
          <motion.div
            className="text-center mx-auto max-w-3xl py-16 lg:py-24 relative z-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.p
              className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              MYVE — Making You Visible Everywhere
            </motion.p>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              Tvoříme weby a aplikace, které{" "}
              <TextRotate
                texts={["přivádějí zákazníky.", "posouvají firmy.", "řeší problémy.", "automatizují procesy."]}
                mainClassName="inline-flex overflow-hidden text-gradient"
                elementLevelClassName="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-gradient"
                staggerDuration={0.03}
                staggerFrom="first"
                rotationInterval={3000}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-8 max-w-xl mx-auto">
              Jsme MYVE — tým, který tvoří moderní weby, webové aplikace a software na míru.
            </p>

            <div className="flex flex-wrap gap-4 mb-10 justify-center">
              <MagneticButton>
                <GradientRimButton as="a" href="#contact" variant="filled">
                  <span>Nezávazná konzultace</span>
                  <ArrowRight className="w-5 h-5" />
                </GradientRimButton>
              </MagneticButton>
              <MagneticButton>
                <GradientRimButton as="a" href="#portfolio" variant="outline">
                  Zobrazit portfolio
                </GradientRimButton>
              </MagneticButton>
            </div>

            <p className="text-muted-foreground text-sm">
              ✦ Spolupracujeme s firmami, které chtějí růst díky technologiím.
            </p>
          </motion.div>
        </div>

        {/* Floating mockup images — desktop only */}
        <div className="hidden lg:block">
          {/* Top-left: GARVYS (desktop monitor mockup) */}
          <FloatingElement depth={1.5} className="top-[5%] left-[1%]">
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -5 }}
              animate={{ opacity: 1, y: 0, rotate: -5 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <img src={MOCKUP_PROJECTS[0].src} alt={MOCKUP_PROJECTS[0].alt} className={MOCKUP_PROJECTS[0].className} fetchPriority="high" decoding="async" width={MOCKUP_PROJECTS[0].width} height={MOCKUP_PROJECTS[0].height} />
            </motion.div>
          </FloatingElement>

          {/* Bottom-left: UltraQuest App (phone mockup) */}
          <FloatingElement depth={4} className="bottom-[8%] left-[6%]">
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <img src={MOCKUP_PROJECTS[1].src} alt={MOCKUP_PROJECTS[1].alt} className={`${MOCKUP_PROJECTS[1].className} scale-x-[-1]`} width={MOCKUP_PROJECTS[1].width} height={MOCKUP_PROJECTS[1].height} loading="lazy" decoding="async" />
            </motion.div>
          </FloatingElement>

          {/* Top-right: Zábava za školou (laptop mockup) */}
          <FloatingElement depth={2} className="top-[5%] right-[1%]">
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: 5 }}
              animate={{ opacity: 1, y: 0, rotate: 5 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <img src={MOCKUP_PROJECTS[2].src} alt={MOCKUP_PROJECTS[2].alt} className={MOCKUP_PROJECTS[2].className} width={MOCKUP_PROJECTS[2].width} height={MOCKUP_PROJECTS[2].height} loading="lazy" decoding="async" />
            </motion.div>
          </FloatingElement>

          {/* Bottom-right: UltraQuest Web (phone mockup) */}
          <FloatingElement depth={3} className="bottom-[8%] right-[5%]">
            <motion.div
              initial={{ opacity: 0, y: 40, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <img src={MOCKUP_PROJECTS[3].src} alt={MOCKUP_PROJECTS[3].alt} className={MOCKUP_PROJECTS[3].className} width={MOCKUP_PROJECTS[3].width} height={MOCKUP_PROJECTS[3].height} loading="lazy" decoding="async" />
            </motion.div>
          </FloatingElement>
        </div>

        {/* Mobile: simplified showcase */}
        <div className="lg:hidden flex justify-center gap-4 pb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="rotate-[-4deg]"
          >
            <img src={MOCKUP_PROJECTS[1].src} alt={MOCKUP_PROJECTS[1].alt} className="w-[140px] h-auto scale-x-[-1]" width={MOCKUP_PROJECTS[1].width} height={MOCKUP_PROJECTS[1].height} loading="lazy" decoding="async" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="rotate-[3deg] mt-8"
          >
            <img src={MOCKUP_PROJECTS[3].src} alt={MOCKUP_PROJECTS[3].alt} className="w-[140px] h-auto" width={MOCKUP_PROJECTS[3].width} height={MOCKUP_PROJECTS[3].height} loading="lazy" decoding="async" />
          </motion.div>
        </div>
      </Floating>
    </section>
  );
};

export default HeroSection;
