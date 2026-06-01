import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";

interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  project_id: string | null;
}

interface Project {
  id: string;
  slug: string | null;
}

const SPEED = 0.5; // px per frame
const REPEAT = 5; // how many times to duplicate logos

const PartnersMarquee = () => {
  const { data: logos } = useQuery({
    queryKey: ["partner-logos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_logos")
        .select("id, name, logo_url, project_id")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as PartnerLogo[];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-slugs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug")
        .eq("visible", true);
      if (error) throw error;
      return data as Project[];
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const autoScrollRef = useRef(true);
  const dragDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const projectSlugMap = useRef<Record<string, string>>({});

  // Build slug map
  useEffect(() => {
    if (projects) {
      const map: Record<string, string> = {};
      projects.forEach((p) => {
        if (p.slug) map[p.id] = p.slug;
      });
      projectSlugMap.current = map;
    }
  }, [projects]);

  const getSetWidth = useCallback(() => {
    if (!stripRef.current || !logos || logos.length === 0) return 0;
    const totalWidth = stripRef.current.scrollWidth;
    return totalWidth / REPEAT;
  }, [logos]);

  // Animation loop
  useEffect(() => {
    if (!logos || logos.length === 0) return;

    const animate = () => {
      if (autoScrollRef.current && !isDraggingRef.current) {
        offsetRef.current -= SPEED;
      }

      const setWidth = getSetWidth();
      if (setWidth > 0) {
        // Wrap around seamlessly
        if (offsetRef.current <= -setWidth) {
          offsetRef.current += setWidth;
        }
        if (offsetRef.current > 0) {
          offsetRef.current -= setWidth;
        }
      }

      if (stripRef.current) {
        stripRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [logos, getSetWidth]);

  // Pointer handlers for drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    lastPointerXRef.current = e.clientX;
    dragDistanceRef.current = 0;
    autoScrollRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - lastPointerXRef.current;
    lastPointerXRef.current = e.clientX;
    dragDistanceRef.current += Math.abs(delta);
    offsetRef.current += delta;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    autoScrollRef.current = true;
  }, []);

  if (!logos || logos.length === 0) return null;

  // Repeat logos REPEAT times
  const allLogos = Array.from({ length: REPEAT }, () => logos).flat();

  const renderLogo = (logo: PartnerLogo, index: number) => {
    const slug = logo.project_id ? projectSlugMap.current[logo.project_id] : null;

    const content = logo.logo_url ? (
      <img
        src={logo.logo_url}
        alt={logo.name}
        className="h-8 md:h-10 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
        draggable={false}
      />
    ) : (
      <span className="text-muted-foreground/40 font-display font-semibold text-lg whitespace-nowrap">
        {logo.name}
      </span>
    );

    if (slug) {
      return (
        <Link
          key={`${logo.id}-${index}`}
          to={`/projekty/${slug}`}
          className="flex items-center justify-center mx-8 md:mx-12 flex-shrink-0"
          draggable={false}
          onClick={(e) => {
            if (dragDistanceRef.current > 5) {
              e.preventDefault();
            }
          }}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={`${logo.id}-${index}`}
        className="flex items-center justify-center mx-8 md:mx-12 flex-shrink-0"
      >
        {content}
      </div>
    );
  };

  return (
    <section className="py-12 md:py-16 overflow-hidden relative">
      <div className="container mx-auto px-6 lg:px-12 mb-8">
        <p className="text-center text-muted-foreground text-sm font-display font-medium uppercase tracking-widest">
          Spolupracuji s
        </p>
      </div>
      <div className="relative group">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          ref={containerRef}
          className="overflow-hidden"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            ref={stripRef}
            className="flex w-max will-change-transform"
            style={{ touchAction: "none" }}
          >
            {allLogos.map((logo, i) => renderLogo(logo, i))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersMarquee;
