import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "lucide-react";
import TextReveal from "@/components/ui/TextReveal";

const cardColors = [
  { border: "hsl(12, 85%, 62%, 0.15)", quote: "hsl(12, 85%, 62%, 0.2)", accent: "hsl(12, 85%, 62%)" },
  { border: "hsl(340, 75%, 58%, 0.15)", quote: "hsl(340, 75%, 58%, 0.2)", accent: "hsl(340, 75%, 58%)" },
  { border: "hsl(280, 70%, 60%, 0.15)", quote: "hsl(280, 70%, 60%, 0.2)", accent: "hsl(280, 70%, 60%)" },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const placeholderTestimonials = [
    {
      id: "1",
      content: "Spolupráce s MYVE byla skvělá. Nový web nám přivedl více zákazníků už během prvních týdnů.",
      author_name: "Jan Novák",
      author_role: "Majitel firmy",
    },
    {
      id: "2",
      content: "Profesionální přístup, rychlá komunikace a výsledky, které mluví za vše. Doporučuji!",
      author_name: "Petra Dvořáková",
      author_role: "Marketing manažerka",
    },
    {
      id: "3",
      content: "Díky správě sociálních sítí se nám podařilo výrazně zvýšit povědomí o naší značce.",
      author_name: "Martin Svoboda",
      author_role: "CEO",
    },
  ];

  const displayTestimonials = testimonials && testimonials.length > 0 ? testimonials : placeholderTestimonials;

  return (
    <section id="testimonials" className="py-20 lg:py-28">
      <div className="container mx-auto px-6 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">
            Reference
          </p>
          <TextReveal className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            Co říkají klienti
          </TextReveal>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {displayTestimonials.map((testimonial, i) => {
            const colors = cardColors[i % cardColors.length];
            return (
              <motion.div
                key={testimonial.id}
                className="bg-card rounded-3xl p-7 lg:p-8 border border-border relative overflow-hidden group"
                style={{ boxShadow: "var(--shadow-card)" }}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ boxShadow: "var(--shadow-card-hover)", y: -4 }}
              >
                {/* Decorative accent line at top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                  style={{ background: colors.accent }}
                />
                <Quote className="w-10 h-10 mb-4" style={{ color: colors.quote }} />
                <p className="text-foreground leading-relaxed mb-6 text-[15px]">
                  „{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  {/* Avatar circle with initial */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-bold text-sm"
                    style={{ background: colors.accent }}
                  >
                    {testimonial.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">{testimonial.author_name}</p>
                    {testimonial.author_role && (
                      <p className="text-muted-foreground text-xs">{testimonial.author_role}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
