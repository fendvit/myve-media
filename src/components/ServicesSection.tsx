import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, Smartphone, Code } from "lucide-react";
import TextReveal from "@/components/ui/TextReveal";
import { DraggableServiceCard } from "@/components/ui/DraggableServiceCard";

const serviceCards = [
  {
    id: 1,
    title: "Web design",
    description:
      "Navrhujeme a vytváříme moderní webové stránky, které jsou rychlé a připravené přivádět nové zákazníky.",
    features: ["firemní weby", "landing pages", "e-shopy", "redesign webu"],
    icon: <Globe size={24} />,
    accentColor: "hsl(12, 85%, 62%)",
    accentBg: "hsla(12, 85%, 62%, 0.12)",
    gradientId: "lineGradient1",
  },
  {
    id: 2,
    title: "Webové aplikace",
    description: "Stavíme webové aplikace na míru — od SaaS platforem po interní systémy a zákaznické portály.",
    features: ["SaaS platformy", "dashboardy", "portály", "interní systémy"],
    icon: <Smartphone size={24} />,
    accentColor: "hsl(340, 75%, 58%)",
    accentBg: "hsla(340, 75%, 58%, 0.12)",
    gradientId: "lineGradient2",
  },
  {
    id: 3,
    title: "Software na míru",
    description: "Vyvíjíme custom software, mobilní aplikace a API integrace přesně podle vašich potřeb.",
    features: ["mobilní aplikace", "API integrace", "automatizace", "custom řešení"],
    icon: <Code size={24} />,
    accentColor: "hsl(280, 70%, 60%)",
    accentBg: "hsla(280, 70%, 60%, 0.12)",
    gradientId: "lineGradient3",
  },
];

// initial positions based on container width
const getInitialPositions = (width: number) => {
  if (width < 768) {
    // Mobile: stacked vertically
    return [
      { x: 0, y: 20 },
      { x: 0, y: 380 },
      { x: 0, y: 740 },
    ];
  }
  if (width < 1024) {
    return [
      { x: -180, y: 40 },
      { x: 180, y: 40 },
      { x: 0, y: 420 },
    ];
  }
  return [
    { x: -360, y: 60 },
    { x: 0, y: 60 },
    { x: 360, y: 60 },
  ];
};

function LinesOverlay({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [paths, setPaths] = useState<string[]>(["", "", ""]);
  const requestRef = useRef<number>();

  useLayoutEffect(() => {
    const updateLines = () => {
      const container = containerRef.current;
      const headerEl = document.getElementById("services-header-anchor");
      if (!container || !headerEl) {
        requestRef.current = requestAnimationFrame(updateLines);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const headerRect = headerEl.getBoundingClientRect();
      const startX = headerRect.left + headerRect.width / 2 - containerRect.left;
      const startY = headerRect.bottom - containerRect.top;

      const newPaths = [1, 2, 3].map((id) => {
        const cardEl = document.getElementById(`service-card-${id}`);
        if (!cardEl) return "";
        const cardRect = cardEl.getBoundingClientRect();
        const endX = cardRect.left + cardRect.width / 2 - containerRect.left;
        const endY = cardRect.top - containerRect.top;
        const dx = endX - startX;
        const curve = Math.abs(dx) * 0.5;
        return `M ${startX} ${startY} Q ${startX + dx / 2} ${startY + curve}, ${endX} ${endY}`;
      });
      setPaths(newPaths);
      requestRef.current = requestAnimationFrame(updateLines);
    };
    requestRef.current = requestAnimationFrame(updateLines);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [containerRef]);

  const gradients = [
    { id: "lineGradient1", color: "hsl(12, 85%, 62%)" },
    { id: "lineGradient2", color: "hsl(340, 75%, 58%)" },
    { id: "lineGradient3", color: "hsl(280, 70%, 60%)" },
  ];

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        {gradients.map((g) => (
          <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={g.color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={g.color} stopOpacity="0.2" />
          </linearGradient>
        ))}
      </defs>
      {paths.map((d, index) => {
        if (!d) return null;
        return (
          <path
            key={index}
            d={d}
            stroke={`url(#${gradients[index].id})`}
            strokeWidth="2"
            strokeDasharray="8 8"
            fill="none"
            strokeLinecap="round"
            className="services-dash-line"
          />
        );
      })}
    </svg>
  );
}

const ServicesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [positions, setPositions] = useState(() =>
    typeof window !== "undefined" ? getInitialPositions(window.innerWidth) : getInitialPositions(1024),
  );
  const [containerHeight, setContainerHeight] = useState(600);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setPositions(getInitialPositions(w));
      setContainerHeight(600);
      setIsDesktop(w >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section id="services" className="py-20 lg:py-28 relative overflow-hidden" ref={sectionRef}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 relative z-[5]"
        >
          <p className="text-primary font-display font-medium text-sm tracking-widest uppercase mb-4">Služby</p>
          <div className="inline-block" id="services-header-anchor">
            <TextReveal className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
              Co pro vás můžeme udělat
            </TextReveal>
          </div>
        </motion.div>

        {isDesktop ? (
          <div ref={cardsContainerRef} className="relative w-full" style={{ height: containerHeight }}>
            <LinesOverlay containerRef={cardsContainerRef} />
            {serviceCards.map((card, i) => (
              <DraggableServiceCard
                key={card.id}
                id={card.id}
                title={card.title}
                description={card.description}
                features={card.features}
                icon={card.icon}
                initialX={positions[i].x}
                initialY={positions[i].y}
                accentColor={card.accentColor}
                accentBg={card.accentBg}
                draggable
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {serviceCards.map((card) => (
              <DraggableServiceCard
                key={card.id}
                id={card.id}
                title={card.title}
                description={card.description}
                features={card.features}
                icon={card.icon}
                initialX={0}
                initialY={0}
                accentColor={card.accentColor}
                accentBg={card.accentBg}
                draggable={false}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes services-dash {
          to { stroke-dashoffset: -1000; }
        }
        .services-dash-line {
          animation: services-dash 20s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default ServicesSection;
