import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  content: string;
}

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, author_name, author_role, content")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section id="references" className="relative py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14 lg:mb-20"
        >
          <p className="text-primary font-display font-medium text-xs tracking-[0.3em] uppercase mb-5">
            Reference
          </p>
          <h2 className="display-type text-[clamp(1.8rem,4.5vw,3.6rem)] text-foreground normal-case">
            Co říkají klienti, <span className="text-primary">kterým už web vydělává.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="relative flex flex-col rounded-2xl bg-card border border-border p-7 lg:p-8"
            >
              <span
                aria-hidden
                className="display-type text-primary/80 text-5xl leading-none select-none"
              >
                „
              </span>
              <blockquote className="text-foreground/90 text-base leading-relaxed mt-3 flex-1">
                {t.content}
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border">
                <p className="font-display font-semibold text-foreground text-sm">
                  {t.author_name}
                </p>
                {t.author_role && (
                  <p className="text-muted-foreground text-xs mt-1">{t.author_role}</p>
                )}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
