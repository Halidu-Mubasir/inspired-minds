import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

interface CtaSectionProps {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CtaSection({
  title = "Ready to get started?",
  subtitle = "Find the right tutor for your child today. Get matched within 48 hours.",
  primaryLabel = "Request a tutor",
  primaryHref = "/contact",
  secondaryLabel,
  secondaryHref,
}: CtaSectionProps) {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,var(--gold),transparent)] opacity-32" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,var(--leaf),transparent)] opacity-80" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold text-white sm:text-5xl">{title}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{subtitle}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={primaryHref} className="btn-gold">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              {secondaryLabel && secondaryHref && (
                <Link href={secondaryHref} className="btn-ghost-light">{secondaryLabel}</Link>
              )}
            </div>
            <a href={`tel:${SITE.phones[0].tel}`} className="mt-7 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
              <Phone className="h-4 w-4" /> Or call us on {SITE.phones[0].display}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
