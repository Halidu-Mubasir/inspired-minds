interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  centered?: boolean;
  light?: boolean;
}

export function SectionHeader({ title, subtitle, eyebrow, centered = true, light = false }: SectionHeaderProps) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className={`eyebrow ${light ? "text-gold" : ""} ${centered ? "justify-center" : ""}`}>
          <span className="h-1.5 w-6 rounded-full bg-gold" aria-hidden />
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-3 font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15] ${
          light ? "text-white" : "text-primary"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/75" : "text-muted-foreground"}`}>{subtitle}</p>
      )}
    </div>
  );
}
