import { motion, useMotionValue } from "framer-motion";
import { useState, type ReactNode } from "react";

export interface DraggableServiceCardProps {
  id: number;
  title: string;
  description: string;
  features: string[];
  icon: ReactNode;
  initialX: number;
  initialY: number;
  accentColor: string;
  accentBg: string;
  draggable?: boolean;
}

function CardContent({
  title,
  description,
  features,
  icon,
  accentColor,
  accentBg,
}: Pick<DraggableServiceCardProps, "title" | "description" | "features" | "icon" | "accentColor" | "accentBg">) {
  return (
    <div
      className="bg-card rounded-3xl border border-border w-full max-w-[340px] sm:w-[320px] p-7 transition-shadow mx-px"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <motion.div
        className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center"
        style={{ backgroundColor: accentBg }}
        variants={{ hover: { rotate: 12, scale: 1.1 } }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
      >
        <div style={{ color: accentColor }}>{icon}</div>
      </motion.div>

      <h3 className="font-display text-xl font-semibold mb-3 text-foreground">{title}</h3>

      <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{description}</p>

      <ul className="space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start text-sm text-muted-foreground">
            <span
              className="inline-block w-2 h-2 rounded-full mt-1.5 mr-2.5 flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DraggableServiceCard({
  id,
  title,
  description,
  features,
  icon,
  initialX,
  initialY,
  accentColor,
  accentBg,
  draggable = true,
}: DraggableServiceCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);

  if (!draggable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: id * 0.1 }}
        className="flex justify-center"
        id={`service-card-${id}`}
        whileHover="hover"
      >
        <CardContent
          title={title}
          description={description}
          features={features}
          icon={icon}
          accentColor={accentColor}
          accentBg={accentBg}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      style={{ x, y, left: "50%", marginLeft: -160 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: id * 0.1 }}
      className={`absolute cursor-grab active:cursor-grabbing ${isDragging ? "z-50" : "z-10"}`}
      id={`service-card-${id}`}
      whileHover="hover"
      whileDrag={{ scale: 1.05, rotate: 3 }}
    >
      <CardContent
        title={title}
        description={description}
        features={features}
        icon={icon}
        accentColor={accentColor}
        accentBg={accentBg}
      />
    </motion.div>
  );
}
