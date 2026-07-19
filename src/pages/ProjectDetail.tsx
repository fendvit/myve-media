import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useState } from "react";

interface Step {
  title: string;
  description: string;
}

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-24 container mx-auto px-6 lg:px-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-secondary rounded-xl" />
            <div className="h-12 w-96 bg-secondary rounded-xl" />
            <div className="aspect-video bg-secondary rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-24 container mx-auto px-6 lg:px-12 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Projekt nenalezen</h1>
          <Link to="/projekty" className="text-primary hover:underline">← Zpět na všechny projekty</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const steps: Step[] = Array.isArray(project.steps)
    ? (project.steps as any[]).map(s => ({ title: s.title || '', description: s.description || '' }))
    : [];
  const screenshots: string[] = Array.isArray(project.screenshots) ? project.screenshots as string[] : [];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${project.title} — Projekt | MYVE`}
        description={(project.description || `Případová studie projektu ${project.title} od studia MYVE.`).slice(0, 155)}
        path={`/projekty/${project.slug}`}
        type="article"
      />
      <Navbar />
      <main>
      <section className="pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <Link
            to="/projekty"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Zpět na projekty</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-primary font-display font-medium text-xs tracking-[0.35em] uppercase mb-4">
              {project.category === "app" ? "Aplikace" : "Web"}
            </p>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{project.title}</h1>

            {project.description && (
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-3xl">{project.description}</p>
            )}

            {project.external_url && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity mb-10"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Globe className="w-4 h-4" />
                {project.category === "app" ? "Otevřít aplikaci" : "Navštívit web"}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </motion.div>

          {project.image_url && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="rounded-3xl overflow-hidden border border-border mb-12">
              <img src={project.image_url} alt={project.title} className="w-full object-cover" />
            </motion.div>
          )}

          {project.result_text && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="rounded-2xl p-6 mb-12 border space-y-2" style={{ backgroundColor: "hsl(var(--primary) / 0.06)", borderColor: "hsl(var(--primary) / 0.2)" }}>
              {project.result_text.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className="text-primary font-display font-semibold text-lg">↗ {line.trim()}</p>
              ))}
            </motion.div>
          )}

          {project.detailed_description && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
              <h2 className="font-display text-2xl font-bold mb-4">O projektu</h2>
              <div
                className="prose prose-neutral max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-display prose-strong:text-foreground prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: project.detailed_description }}
              />
            </motion.div>
          )}

          {steps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-12">
              <h2 className="font-display text-2xl font-bold mb-6">Jak jsme postupovali</h2>
              <div className="space-y-6">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-white text-sm"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-1">{step.title}</h3>
                      {/* Data may contain literal "\n" sequences as well as real newlines */}
                      {step.description
                        .split(/\\n|\n/)
                        .map((line) => line.trim().replace(/^[,;]\s*/, ""))
                        .filter(Boolean)
                        .map((line, li) => (
                          <p key={li} className="text-muted-foreground leading-relaxed">
                            {line}
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {screenshots.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
              <h2 className="font-display text-2xl font-bold mb-6">Galerie</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {screenshots.map((url, i) => (
                  <button key={i} onClick={() => setSelectedImage(url)} aria-label={`Otevřít screenshot ${i + 1} projektu ${project.title}`} className="rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-colors cursor-pointer">
                    <img src={url} alt={`Screenshot ${i + 1} projektu ${project.title}`} className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 cursor-pointer" onClick={() => setSelectedImage(null)}>
          <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src={selectedImage} alt="Screenshot" className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
        </div>
      )}

      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;
