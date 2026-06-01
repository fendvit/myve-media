import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

const categories = [
  { key: "all", label: "Vše" },
  { key: "web", label: "Weby" },
  { key: "app", label: "Aplikace" },
];

const Projects = () => {
  const [activeCategory, setActiveCategory] = useState("all");

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

  const filtered =
    activeCategory === "all"
      ? projects
      : projects?.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Projekty — MYVE"
        description="Portfolio realizovaných webů a aplikací studia MYVE. Případové studie, technologie a výsledky."
        path="/projekty"
      />
      <Navbar />
      <main>
      <section className="pt-32 pb-24 lg:pt-40 lg:pb-32">
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
            className="mb-12"
          >
            <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">
              Portfolio
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold">
              Všechny projekty
            </h1>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2.5 rounded-full font-display text-sm font-medium transition-all duration-300 border ${
                  activeCategory === cat.key
                    ? "text-primary-foreground border-transparent"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
                style={activeCategory === cat.key ? { background: "var(--gradient-primary)" } : undefined}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-3xl border border-border animate-pulse aspect-[4/3]" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <AnimatePresence mode="popLayout">
                {filtered.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35 }}
                    className="bg-card rounded-3xl overflow-hidden border border-border hover:border-transparent transition-all group gradient-border"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="aspect-video bg-secondary flex items-center justify-center overflow-hidden">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ExternalLink className="w-8 h-8" />
                          <span className="text-sm">Screenshot projektu</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="font-display text-xl font-semibold mb-2">{project.title}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="font-display text-xs rounded-full px-3">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {project.result_text && (
                        <div className="mb-3 space-y-1">
                          {project.result_text.split('\n').filter(Boolean).map((line, i) => (
                            <p key={i} className="text-primary font-medium text-sm">↗ {line.trim()}</p>
                          ))}
                        </div>
                      )}
                      {project.slug && (
                        <Link to={`/projekty/${project.slug}`} className="inline-flex items-center gap-2 text-sm font-display font-semibold text-foreground hover:text-primary transition-colors group/link">
                          Více o projektu
                          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-center py-20 text-lg">
              Žádné projekty v této kategorii.
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
