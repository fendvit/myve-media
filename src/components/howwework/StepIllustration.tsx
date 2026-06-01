import { motion } from "framer-motion";

const float = (delay = 0, dist = 8, dur = 6) => ({
  animate: { y: [0, -dist, 0] },
  transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay },
});

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    {children}
  </div>
);

export const IllustrationAnalyze = () => (
  <Frame>
    <motion.svg
      viewBox="0 0 320 260"
      className="w-full h-full max-h-[260px]"
      {...float(0, 6, 7)}
    >
      <defs>
        <linearGradient id="ana-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* Stacked translucent blueprint layers */}
      {[0, 1, 2].map((i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 * i }}
        >
          <rect
            x={70 - i * 8}
            y={70 + i * 18}
            width="180"
            height="120"
            rx="14"
            fill="url(#ana-g)"
            opacity={0.18 + i * 0.1}
            stroke="hsl(var(--primary) / 0.4)"
            strokeWidth="1"
          />
        </motion.g>
      ))}
      {/* Inner content lines on top layer */}
      <g transform="translate(86, 100)">
        <rect width="60" height="40" rx="6" fill="hsl(var(--primary) / 0.35)" />
        <rect x="68" width="80" height="14" rx="4" fill="hsl(var(--foreground) / 0.18)" />
        <rect x="68" y="20" width="60" height="10" rx="3" fill="hsl(var(--foreground) / 0.12)" />
        <rect y="50" width="148" height="10" rx="3" fill="hsl(var(--foreground) / 0.1)" />
      </g>
      {/* Floating check badge */}
      <motion.g {...float(0.5, 5, 5)}>
        <circle cx="262" cy="60" r="22" fill="hsl(var(--accent) / 0.25)" />
        <circle cx="262" cy="60" r="14" fill="url(#ana-g)" />
        <path d="M256 60 l4 4 l8 -8" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      {/* Dotted grid */}
      <g fill="hsl(var(--primary) / 0.4)">
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={210 + c * 8} cy={210 + r * 8} r="1.2" />
          ))
        )}
      </g>
    </motion.svg>
  </Frame>
);

export const IllustrationDesign = () => (
  <Frame>
    <motion.svg viewBox="0 0 320 260" className="w-full h-full max-h-[260px]" {...float(0.2, 7, 6.5)}>
      <defs>
        <linearGradient id="des-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      {/* Browser frame */}
      <rect x="40" y="50" width="220" height="170" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <rect x="40" y="50" width="220" height="22" rx="12" fill="hsl(var(--primary) / 0.18)" />
      <circle cx="54" cy="61" r="3" fill="hsl(var(--primary) / 0.5)" />
      <circle cx="64" cy="61" r="3" fill="hsl(var(--accent) / 0.5)" />
      <circle cx="74" cy="61" r="3" fill="hsl(var(--primary) / 0.3)" />
      {/* Wireframe blocks */}
      <rect x="56" y="86" width="80" height="56" rx="6" fill="none" stroke="hsl(var(--foreground) / 0.25)" strokeDasharray="3 3" />
      <path d="M58 88 L134 140 M134 88 L58 140" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="1" />
      <rect x="148" y="86" width="96" height="20" rx="4" fill="hsl(var(--foreground) / 0.1)" />
      <rect x="148" y="112" width="70" height="10" rx="3" fill="hsl(var(--foreground) / 0.08)" />
      <rect x="148" y="128" width="86" height="14" rx="4" fill="hsl(var(--foreground) / 0.08)" />
      <rect x="56" y="156" width="60" height="44" rx="6" fill="hsl(var(--foreground) / 0.06)" />
      <text x="78" y="183" fontSize="20" fontFamily="serif" fill="hsl(var(--foreground) / 0.4)">T</text>
      <rect x="128" y="170" width="116" height="30" rx="8" fill="url(#des-g)" />
      {/* Magic wand badge */}
      <motion.g {...float(0.6, 5, 5.5)}>
        <circle cx="270" cy="58" r="22" fill="hsl(var(--accent) / 0.25)" />
        <circle cx="270" cy="58" r="14" fill="url(#des-g)" />
        <path d="M264 64 l12 -12 M274 52 l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      {/* Sparkles */}
      {[
        { x: 240, y: 40, d: 0 },
        { x: 296, y: 90, d: 0.7 },
        { x: 246, y: 100, d: 1.2 },
      ].map((s, i) => (
        <motion.g key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }} transition={{ duration: 2.4, repeat: Infinity, delay: s.d }} style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y - 5} L${s.x + 1.5} ${s.y - 1.5} L${s.x + 5} ${s.y} L${s.x + 1.5} ${s.y + 1.5} L${s.x} ${s.y + 5} L${s.x - 1.5} ${s.y + 1.5} L${s.x - 5} ${s.y} L${s.x - 1.5} ${s.y - 1.5} Z`} fill="hsl(var(--primary))" />
        </motion.g>
      ))}
    </motion.svg>
  </Frame>
);

export const IllustrationCode = () => (
  <Frame>
    <motion.svg viewBox="0 0 320 260" className="w-full h-full max-h-[260px]" {...float(0.1, 6, 7)}>
      <defs>
        <linearGradient id="code-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      {/* Code window */}
      <rect x="60" y="90" width="180" height="120" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <rect x="60" y="90" width="180" height="18" rx="10" fill="hsl(var(--primary) / 0.15)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(74, ${122 + i * 18})`}>
          <rect width={60 + (i % 2) * 30} height="6" rx="2" fill="hsl(var(--primary) / 0.4)" />
          <rect x={70 + (i % 2) * 30} width={40 + (i % 3) * 20} height="6" rx="2" fill="hsl(var(--accent) / 0.45)" />
        </g>
      ))}
      {/* Server stack */}
      <g transform="translate(40, 150)">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0, ${i * 18})`}>
            <rect width="46" height="14" rx="3" fill="hsl(var(--card))" stroke="hsl(var(--primary) / 0.4)" />
            <circle cx="6" cy="7" r="2" fill="hsl(var(--primary))" />
            <circle cx="13" cy="7" r="2" fill="hsl(var(--accent))" />
          </g>
        ))}
      </g>
      {/* Rocket */}
      <motion.g {...float(0, 10, 4.5)}>
        <g transform="translate(230, 40)">
          <path d="M20 0 C28 8 30 22 26 36 L14 36 C10 22 12 8 20 0 Z" fill="url(#code-g)" />
          <circle cx="20" cy="16" r="4" fill="white" opacity="0.9" />
          <path d="M14 36 L8 46 L18 42 Z" fill="hsl(var(--primary) / 0.6)" />
          <path d="M26 36 L32 46 L22 42 Z" fill="hsl(var(--accent) / 0.6)" />
          <motion.path
            d="M16 42 L20 56 L24 42 Z"
            fill="hsl(var(--primary))"
            animate={{ opacity: [0.5, 1, 0.5], scaleY: [0.8, 1.1, 0.8] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ transformOrigin: "20px 42px" }}
          />
        </g>
      </motion.g>
      {/* Shield badge */}
      <motion.g {...float(0.4, 5, 5)}>
        <g transform="translate(208, 168)">
          <path d="M20 0 L36 6 L36 22 C36 32 28 38 20 42 C12 38 4 32 4 22 L4 6 Z" fill="url(#code-g)" />
          <path d="M14 22 l5 5 l9 -10" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </motion.g>
    </motion.svg>
  </Frame>
);

export const IllustrationLaunch = () => (
  <Frame>
    <motion.svg viewBox="0 0 320 260" className="w-full h-full max-h-[260px]" {...float(0.3, 7, 6)}>
      <defs>
        <linearGradient id="lan-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      {/* Dashboard window */}
      <rect x="40" y="50" width="220" height="170" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
      <rect x="40" y="50" width="220" height="22" rx="12" fill="hsl(var(--primary) / 0.18)" />
      {/* Checklist */}
      <g transform="translate(58, 88)">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(0, ${i * 18})`}>
            <circle cx="6" cy="6" r="5" fill="hsl(var(--primary) / 0.25)" />
            <path d="M3 6 l2 2 l4 -4" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="16" y="3" width={50 + (i % 3) * 14} height="6" rx="2" fill="hsl(var(--foreground) / 0.18)" />
          </g>
        ))}
      </g>
      {/* Chart */}
      <g transform="translate(150, 88)">
        <rect width="96" height="56" rx="6" fill="hsl(var(--foreground) / 0.04)" />
        <polyline points="6,46 22,30 38,38 54,18 72,26 90,10" fill="none" stroke="url(#lan-g)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {[ [22,30],[38,38],[54,18],[72,26],[90,10] ].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--primary))" />
        ))}
      </g>
      {/* Donut */}
      <g transform="translate(160, 158)">
        <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="6" />
        <circle cx="22" cy="22" r="18" fill="none" stroke="url(#lan-g)" strokeWidth="6" strokeDasharray="80 113" strokeLinecap="round" transform="rotate(-90 22 22)" />
      </g>
      {/* Magnifier with check */}
      <motion.g {...float(0.5, 6, 5)}>
        <g transform="translate(200, 150)">
          <circle cx="26" cy="26" r="24" fill="hsl(var(--card))" stroke="url(#lan-g)" strokeWidth="3" />
          <circle cx="26" cy="26" r="14" fill="url(#lan-g)" />
          <path d="M20 26 l4 4 l8 -8" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="44" y="44" width="16" height="5" rx="2.5" transform="rotate(45 44 44)" fill="hsl(var(--primary))" />
        </g>
      </motion.g>
    </motion.svg>
  </Frame>
);

export const ILLUSTRATIONS = [
  IllustrationAnalyze,
  IllustrationDesign,
  IllustrationCode,
  IllustrationLaunch,
];
