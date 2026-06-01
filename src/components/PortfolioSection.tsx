import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import TextReveal from "@/components/ui/TextReveal";
import DeviceMockup from "@/components/ui/device-mockup";
import GradientRimButton from "@/components/ui/GradientRimButton";
import { cn } from "@/lib/utils";

type DeviceVariant = "desktop" | "laptop" | "phone" | "tablet";

const SLOTS: {
  variant: DeviceVariant;
  // Desktop absolute positioning + rotation
  position: string;
  rotate: number;
  z: number;
}[] = [
  { variant: "desktop", position: "top-0 left-0", rotate: 0, z: 20 },
  { variant: "laptop", position: "top-[58%] left-[4%]", rotate: 0, z: 15 },
  { variant: "phone", position: "top-[42%] left-[58%]", rotate: 0, z: 30 },
  { variant: "laptop", position: "top-[6%] right-0", rotate: 0, z: 10 },
];

const PortfolioSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgX = useTransform(scrollYProgress, [0, 1], ["10%", "-50%"]);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: partnerLogos } = useQuery({
    queryKey: ["partner-logos-by-project"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_logos")
        .select("project_id, logo_url, name")
        .not("project_id", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const logoByProject = useMemo(() => {
    const map: Record<string, { logo_url: string; name: string }> = {};
    (partnerLogos || []).forEach((l: any) => {
      if (l.project_id) map[l.project_id] = { logo_url: l.logo_url, name: l.name };
    });
    return map;
  }, [partnerLogos]);

  const placeholders = Array.from({ length: 4 }).map((_, i) => ({
    id: `ph-${i}`,
    title: `Projekt ${i + 1}`,
    description: "Ukázka projektu připravovaná v naší dílně.",
    image_url: null as string | null,
    slug: null as string | null,
  }));

  const base = projects && projects.length > 0 ? projects : [];
  const display = [...base, ...placeholders].slice(0, 4);

  const renderMockup = (project: any, variant: DeviceVariant) => {
    const fallback =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23eadfd2'/></svg>";
    const logo = logoByProject[project.id];
    const node = (
      <DeviceMockup
        variant={variant}
        src={project.image_url || fallback}
        alt={project.title}
        className="drop-shadow-2xl"
        hoverSrc={logo?.logo_url}
        hoverAlt={logo?.name}
      />
    );
    return project.slug ? (
      <Link to={`/projekty/${project.slug}`} className="block">
        {node}
      </Link>
    ) : (
      node
    );
  };

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="relative py-20 lg:py-28 overflow-hidden"
    >
      {/* Scrolling background wordmark */}
      <div className="absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden z-0">
        <motion.div
          style={reduced ? undefined : { x: bgX }}
          className="flex gap-16 whitespace-nowrap"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="font-display font-bold text-foreground/[0.06] text-[10rem] md:text-[16rem] lg:text-[22rem] leading-none tracking-tight"
            >
              Naše práce
            </span>
          ))}
        </motion.div>
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">
            Portfolio
          </p>
          <TextReveal className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            Naše práce
          </TextReveal>
        </motion.div>

        {/* Desktop: staggered absolute composition */}
        <div className="hidden lg:block relative h-[820px] xl:h-[940px] max-w-6xl mx-auto">
          {display.map((project, i) => {
            const slot = SLOTS[i];
            return (
              <motion.div
                key={project.id}
                className={`group absolute ${slot.position}`}
                style={{ zIndex: slot.z, rotate: `${slot.rotate}deg` }}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.12, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
              >
                {renderMockup(project, slot.variant)}
                <div className="mt-6 text-center max-w-[300px] mx-auto">
                  <span className="block text-[10px] tracking-[0.25em] uppercase text-primary/80 font-display font-medium mb-1.5">
                    Projekt
                  </span>
                  <p className="font-display font-semibold text-base text-foreground leading-snug relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 group-hover:after:w-full">
                    {project.title}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tablet: 2x2 grid */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-10 place-items-center max-w-3xl mx-auto">
          {display.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group flex flex-col items-center"
              
            >
              {renderMockup(project, SLOTS[i].variant)}
              <div className="mt-4 text-center">
                <span className="block text-[10px] tracking-[0.25em] uppercase text-primary/80 font-display font-medium mb-1">
                  Projekt
                </span>
                <p className="font-display font-semibold text-sm text-foreground leading-snug">
                  {project.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden flex flex-col items-center gap-10">
          {display.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex flex-col items-center"
            >
              {renderMockup(project, SLOTS[i].variant)}
              <div className="mt-4 text-center">
                <span className="block text-[10px] tracking-[0.25em] uppercase text-primary/80 font-display font-medium mb-1">
                  Projekt
                </span>
                <p className="font-display font-semibold text-sm text-foreground leading-snug">
                  {project.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* "Všechny projekty" button */}
        <motion.div
          className="flex justify-center mt-16 lg:mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GradientRimButton
            variant="filled"
            renderInner={({ className, children }) => (
              <Link to="/projekty" className={cn(className, "group")} style={{ background: "var(--gradient-primary)" }}>
                {children}
              </Link>
            )}
          >
            <span>Všechny projekty</span>
            <span className="relative flex items-center justify-center w-6 h-6 overflow-hidden">
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-6" />
              <ArrowRight className="w-5 h-5 absolute -translate-x-6 transition-transform duration-300 group-hover:translate-x-0" />
            </span>
          </GradientRimButton>
        </motion.div>
      </div>
    </section>
  );
};

export default PortfolioSection;
