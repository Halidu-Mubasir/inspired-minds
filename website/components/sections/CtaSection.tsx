import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CtaSectionProps {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CtaSection({
  title = "Ready to Get Started?",
  subtitle = "Find the perfect tutor for your child today. Get matched within 48 hours.",
  primaryLabel = "Contact Us",
  primaryHref = "/contact",
  secondaryLabel,
  secondaryHref,
}: CtaSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-3xl px-8 py-16 text-center"
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)",
          }}
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-white/85 max-w-xl mx-auto">{subtitle}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-lg bg-white text-sky-700 hover:bg-white/90 font-semibold text-base px-8 py-3 transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-lg border border-white/50 text-white bg-white/10 hover:bg-white/20 font-semibold text-base px-8 py-3 transition-colors"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
