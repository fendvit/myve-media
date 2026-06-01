import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  gradient?: ReactNode;
  gradientBlock?: boolean;
}

const TextReveal = ({ children, className = "", delay = 0, as: Tag = "h2", gradient, gradientBlock = false }: TextRevealProps) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<HTMLElement>, { once: true, margin: "-80px" });

  const words = children.split(" ");

  const inner = (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.4, delay: delay + i * 0.06, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      ))}
      {gradient && (
        <motion.span
          className={gradientBlock ? "block" : "inline-block"}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.4, delay: delay + words.length * 0.06, ease: "easeOut" }}
        >
          {gradient}
        </motion.span>
      )}
    </>
  );

  const sharedProps = { ref: ref as any, className };

  if (Tag === "h1") return <h1 {...sharedProps}>{inner}</h1>;
  if (Tag === "h2") return <h2 {...sharedProps}>{inner}</h2>;
  if (Tag === "h3") return <h3 {...sharedProps}>{inner}</h3>;
  if (Tag === "p") return <p {...sharedProps}>{inner}</p>;
  return <div {...sharedProps}>{inner}</div>;
};

export default TextReveal;
