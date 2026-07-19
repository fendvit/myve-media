import { useEffect, useRef, useState } from "react";
import { motion, MotionValue, transform, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import GradientRimButton from "@/components/ui/GradientRimButton";
import DeviceMockup from "@/components/ui/device-mockup";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/video/closer.mp4";
const POSTER_SRC = "/video/closer-poster.jpg";

const hostOf = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

const ProjectMockup = ({ project, className }: { project: any; className?: string }) => {
  const isApp = project.category === "app";
  const mockup = (
    <DeviceMockup
      variant={isApp ? "phone" : "desktop"}
      src={
        project.image_url ||
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23141416'/></svg>"
      }
      alt={project.title}
      label={hostOf(project.external_url)}
      className={cn(isApp ? "max-w-[150px] md:max-w-[240px] mx-auto" : "max-w-[300px] md:max-w-[560px] mx-auto", className)}
    />
  );
  return project.slug ? (
    <Link to={`/projekty/${project.slug}`} className="group block">
      {mockup}
    </Link>
  ) : (
    <div className="group">{mockup}</div>
  );
};

/**
 * One full-viewport project layer. Fades/slides in during its slice of the
 * pinned scroll range; the first layer is visible on entry, the last one
 * stays visible until the section unpins.
 */
const ShowcaseItem = ({
  p,
  index,
  count,
  project,
  active,
}: {
  p: MotionValue<number>;
  index: number;
  count: number;
  project: any;
  active: boolean;
}) => {
  const start = index / count;
  const end = (index + 1) / count;
  const f = (end - start) * 0.28;

  // Horizontal reveal: each new project slides in from the right, and the
  // outgoing one slides off to the left — a carousel-style hand-off rather
  // than a vertical fade. First layer sits in place on entry; the last one
  // stays put until the section unpins.
  const keys: number[] = [];
  const opacities: number[] = [];
  const xs: number[] = [];
  if (index === 0) {
    keys.push(0);
    opacities.push(1);
    xs.push(0);
  } else {
    keys.push(start, start + f);
    opacities.push(0, 1);
    xs.push(90, 0);
  }
  if (index === count - 1) {
    keys.push(1);
    opacities.push(1);
    xs.push(0);
  } else {
    keys.push(end - f, end);
    opacities.push(1, 0);
    xs.push(0, -90);
  }

  // Function transforms opt out of framer's WAAPI scroll handoff, which
  // misbehaves with Lenis-driven pinned sections (frozen keyframe values).
  const opacity = useTransform(p, (v) => transform(v, keys, opacities));
  const x = useTransform(p, (v) => transform(v, keys, xs));

  return (
    <motion.div
      style={{ opacity, x, pointerEvents: active ? "auto" : "none" }}
      className="absolute inset-0 z-10"
    >
      <div className="container mx-auto px-6 lg:px-12 h-full flex flex-col justify-start md:justify-center gap-6 pt-44 pb-48 md:pt-16 md:pb-0 md:grid md:grid-cols-2 md:items-center md:gap-12">
        <div>
          <div
            aria-hidden
            className="display-type text-foreground/[0.14] text-[clamp(3.5rem,12vw,10rem)] leading-none select-none"
          >
            {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="display-type text-foreground text-[clamp(1.9rem,4.5vw,4rem)] leading-[1.05] -mt-1 md:-mt-5">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mt-4 max-w-md line-clamp-3">
            {project.description}
          </p>
          {project.slug && (
            <Link
              to={`/projekty/${project.slug}`}
              className="group inline-flex items-center gap-2 text-primary font-display font-medium text-sm mt-6"
            >
              <span>Detail projektu</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
        <ProjectMockup project={project} />
      </div>
    </motion.div>
  );
};

const WorkSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  const { data: projects } = useQuery({
    queryKey: ["work-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const display = projects ?? [];
  const count = display.length;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (!count) return;
      const idx = Math.min(count - 1, Math.max(0, Math.floor(v * count)));
      setActive((prev) => (prev === idx ? prev : idx));
    });
    return unsub;
  }, [scrollYProgress, count]);

  const ctaOpacity = useTransform(scrollYProgress, (v) => transform(v, [0.72, 0.84], [0, 1]));

  const cta = (
    <GradientRimButton
      variant="filled"
      renderInner={({ className, children }) => (
        <Link
          to="/projekty"
          className={cn(className, "group")}
          style={{ background: "var(--gradient-primary)" }}
        >
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
  );

  const header = (
    <>
      <p className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-2">
        Portfolio
      </p>
      <h2 className="display-type text-foreground text-[clamp(1.6rem,3vw,2.6rem)]">Naše práce</h2>
    </>
  );

  if (reduced) {
    // Static fallback: poster + stacked projects, no pinning
    return (
      <section id="portfolio" className="relative py-24 overflow-hidden bg-background">
        <img
          src={POSTER_SRC}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-background/20" />
        <div className="container relative z-10 mx-auto px-6 lg:px-12">
          <div className="mb-16">{header}</div>
          <div className="space-y-20">
            {display.map((project: any, i: number) => (
              <div key={project.id} className="grid md:grid-cols-2 gap-8 md:items-center">
                <div>
                  <div aria-hidden className="display-type text-foreground/[0.14] text-6xl select-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="display-type text-foreground text-3xl mt-1">{project.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-3 max-w-md line-clamp-3">
                    {project.description}
                  </p>
                </div>
                <ProjectMockup project={project} />
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-20">{cta}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" ref={sectionRef} className="relative h-[350vh] bg-background">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Background clip — THE CLOSER, playing the whole time */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
        {/* Directional scrim — type reads on the left, the walk stays visible on the right */}
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-background via-background/45 to-background/5" />
        <div className="absolute inset-0 md:hidden bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

        {/* Section header — persistent */}
        <div className="absolute inset-x-0 top-20 md:top-24 z-20 pointer-events-none">
          <div className="container mx-auto px-6 lg:px-12">{header}</div>
        </div>

        {/* Project layers */}
        {display.map((project: any, i: number) => (
          <ShowcaseItem
            key={project.id}
            p={scrollYProgress}
            index={i}
            count={count}
            project={project}
            active={active === i}
          />
        ))}

        {/* Progress */}
        {count > 1 && (
          <div className="absolute bottom-8 z-20 inset-x-0">
            <div className="container mx-auto px-6 lg:px-12 flex items-center gap-2">
              {display.map((project: any, i: number) => (
                <span
                  key={project.id}
                  className={cn(
                    "h-[3px] rounded-full transition-all duration-500",
                    active === i ? "w-8 bg-primary" : "w-3 bg-foreground/25"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA — fades in with the last project */}
        <motion.div
          style={{ opacity: ctaOpacity, pointerEvents: active === count - 1 && count > 0 ? "auto" : "none" }}
          className="absolute bottom-20 md:bottom-8 inset-x-0 z-20 flex justify-center"
        >
          {cta}
        </motion.div>
      </div>
    </section>
  );
};

export default WorkSection;
