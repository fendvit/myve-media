import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, transform, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import DeviceMockup from "@/components/ui/device-mockup";
import { cn } from "@/lib/utils";

type DeviceVariant = "phone" | "laptop" | "tablet" | "desktop";

const variantFor = (project: any): DeviceVariant => {
  return project.category === "app" ? "phone" : "desktop";
};

const hostOf = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

const Projects = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start end", "end start"],
  });
  const wordmarkX = useTransform(scrollYProgress, (v) => transform(v, [0, 1], ["5%", "-45%"]));

  const { data: projects, isLoading } = useQuery({
    queryKey: ["all-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true });
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

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Projekty — MYVE"
        description="Portfolio realizovaných webů a aplikací studia MYVE. Případové studie, technologie a výsledky."
        path="/projekty"
      />
      <Navbar />
      <main ref={pageRef} className="relative overflow-hidden">
        {/* Scrolling background wordmark */}
        <div className="absolute inset-0 flex items-start pt-[38vh] pointer-events-none select-none overflow-hidden z-0">
          <motion.div
            style={reduced ? undefined : { x: wordmarkX }}
            className="flex gap-24 whitespace-nowrap"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="display-type text-foreground/[0.04] text-[22vw] leading-none"
              >
                Naše práce
              </span>
            ))}
          </motion.div>
        </div>

        <section className="relative z-10 pt-32 pb-24 lg:pt-40 lg:pb-32">
          <div className="container mx-auto px-6 lg:px-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Zpět na hlavní stránku</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-20 lg:mb-28"
            >
              <p className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-4">
                Portfolio
              </p>
              <h1 className="display-type text-foreground text-[clamp(2.6rem,8vw,7rem)]">
                Všechny projekty
              </h1>
            </motion.div>

            {isLoading ? (
              <div className="flex flex-col gap-24">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid lg:grid-cols-2 gap-12 items-center animate-pulse">
                    <div className="bg-card rounded-3xl border border-border aspect-video" />
                    <div className="space-y-4">
                      <div className="h-4 w-24 bg-card rounded" />
                      <div className="h-10 w-2/3 bg-card rounded" />
                      <div className="h-20 w-full bg-card rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="flex flex-col gap-28 lg:gap-40">
                {projects.map((project: any, i: number) => {
                  const logo = logoByProject[project.id];
                  const variant = variantFor(project);
                  const flip = i % 2 === 1;

                  const mockup = (
                    <DeviceMockup
                      variant={variant}
                      src={
                        project.image_url ||
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23141416'/></svg>"
                      }
                      alt={project.title}
                      label={hostOf(project.external_url)}
                      className={variant === "phone" ? "max-w-[220px] mx-auto" : "max-w-[560px] mx-auto"}
                      hoverSrc={logo?.logo_url}
                      hoverAlt={logo?.name}
                    />
                  );

                  return (
                    <motion.article
                      key={project.id}
                      initial={{ opacity: 0, y: 60 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-120px" }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={cn(
                        "group grid lg:grid-cols-2 gap-12 lg:gap-20 items-center",
                        flip && "lg:[direction:rtl]"
                      )}
                    >
                      {/* Mockup */}
                      <div className="[direction:ltr] flex justify-center py-6">
                        {project.slug ? (
                          <Link to={`/projekty/${project.slug}`} className="block">
                            {mockup}
                          </Link>
                        ) : (
                          mockup
                        )}
                      </div>

                      {/* Text */}
                      <div className="[direction:ltr]">
                        <span className="display-type text-primary/70 text-5xl lg:text-6xl block mb-4">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h2 className="font-display font-bold text-2xl lg:text-4xl text-foreground mb-4 leading-tight">
                          {project.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-5">
                          {project.description}
                        </p>
                        {project.result_text && (
                          <div className="mb-6 space-y-1.5">
                            {project.result_text
                              .split("\n")
                              .filter(Boolean)
                              .map((line: string, li: number) => (
                                <p key={li} className="text-primary font-medium text-sm">
                                  ↗ {line.trim()}
                                </p>
                              ))}
                          </div>
                        )}
                        {project.slug && (
                          <Link
                            to={`/projekty/${project.slug}`}
                            className="inline-flex items-center gap-2 font-display font-semibold text-foreground hover:text-primary transition-colors group/link"
                          >
                            Více o projektu
                            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground text-center py-20 text-lg"
              >
                Žádné projekty zatím nejsou zveřejněné.
              </motion.p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Projects;
