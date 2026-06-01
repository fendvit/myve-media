const FloatingShapes = ({ variant = "default" }: { variant?: "default" | "hero" | "contact" }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Coral circle */}
      <div
        className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full opacity-[0.07] animate-float-slow"
        style={{ background: "hsl(12, 85%, 62%)", top: "10%", left: "-3%", animationDelay: "0s" }}
      />
      {/* Purple ring */}
      <div
        className="absolute w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] border-accent/20 animate-float-medium"
        style={{ top: "25%", right: "5%", animationDelay: "1s" }}
      />
      {/* Small coral dot */}
      <div
        className="absolute w-4 h-4 md:w-6 md:h-6 rounded-full opacity-20 animate-float-fast"
        style={{ background: "hsl(12, 85%, 62%)", bottom: "30%", left: "15%", animationDelay: "2s" }}
      />
      {/* Rotating triangle (via CSS) */}
      <div
        className="absolute w-12 h-12 md:w-16 md:h-16 animate-spin-slow opacity-[0.06]"
        style={{
          top: "60%",
          right: "12%",
          background: "hsl(280, 70%, 60%)",
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }}
      />
      {/* Soft purple blob */}
      <div
        className="absolute w-40 h-40 md:w-64 md:h-64 rounded-full opacity-[0.05] animate-float-medium"
        style={{ background: "hsl(280, 70%, 60%)", bottom: "5%", right: "-5%", animationDelay: "3s" }}
      />
      {variant === "hero" && (
        <>
          {/* Extra hero shapes */}
          <div
            className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full opacity-30 animate-pulse-soft"
            style={{ background: "hsl(340, 75%, 58%)", top: "40%", left: "8%", animationDelay: "0.5s" }}
          />
          <div
            className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-primary/10 animate-spin-reverse"
            style={{ bottom: "20%", left: "20%", animationDelay: "2s" }}
          />
        </>
      )}
      {variant === "contact" && (
        <>
          <div
            className="absolute w-24 h-24 rounded-full opacity-[0.08] animate-float-slow"
            style={{ background: "hsl(12, 85%, 62%)", top: "20%", right: "20%", animationDelay: "1s" }}
          />
        </>
      )}
    </div>
  );
};

export default FloatingShapes;
