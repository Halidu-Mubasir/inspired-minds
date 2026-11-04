import { CheckCircle2 } from "lucide-react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlights?: string[];
}

/** The header band for inner pages: same brand voice as the home hero, lighter weight. */
export function PageHero({ eyebrow, title, subtitle, highlights }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--gold-soft),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="eyebrow">
          <span className="h-1.5 w-6 rounded-full bg-gold" aria-hidden /> {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-primary sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
        {highlights && (
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-foreground/80">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-leaf" /> {h}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
