import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/site";

const TRUST = ["All tutors fully vetted", "Matched within 48 hours", "In-home sessions across Tamale"];

/** Illustration of the service: a matched tutor and the lesson plan that follows in the portal. */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 pb-10 pt-12 shadow-xl">
        {/* Sun rays, after the bulb in the logo */}
        <svg viewBox="0 0 200 200" className="absolute -right-10 -top-10 h-64 w-64 text-gold/30">
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (Math.PI / 8) * i + Math.PI / 2;
            return (
              <line key={i} x1={100 + Math.cos(a) * 52} y1={100 + Math.sin(a) * 52} x2={100 + Math.cos(a) * 92} y2={100 + Math.sin(a) * 92}
                stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
            );
          })}
        </svg>
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,var(--leaf),transparent)] opacity-64" />

        <div className="relative rounded-2xl bg-card p-5 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Tutor matched
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-base font-bold text-gold-foreground">KM</span>
            <div>
              <p className="font-semibold text-foreground">Mathematics tutor</p>
              <p className="text-sm text-muted-foreground">BSc Mathematics · 8 years teaching</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-secondary px-3 py-2 font-medium text-secondary-foreground">SHS 2 · WASSCE prep</span>
            <span className="rounded-lg bg-secondary px-3 py-2 font-medium text-secondary-foreground">Tue &amp; Thu · 4 pm</span>
          </div>
        </div>

        <div className="relative -mb-2 ml-8 mt-4 rounded-2xl bg-card p-5 shadow-lg sm:ml-16">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <CalendarCheck className="h-4 w-4" /> Lesson plan shared
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {["Factorising quadratics", "Completing the square", "Homework: Exercise 3"].map((t, i) => (
              <li key={t} className="flex items-center gap-2">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${i < 2 ? "bg-success text-white" : "border border-border"}`}>
                  {i < 2 && <CheckCircle2 className="h-3 w-3" />}
                </span>
                <span className={i < 2 ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground"}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute -left-4 top-1/2 hidden items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-primary shadow-lg ring-1 ring-border sm:flex">
        <ShieldCheck className="h-4 w-4 text-leaf" /> Vetted &amp; interviewed
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--gold-soft),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-24">
        <div>
          <p className="eyebrow">
            <span className="h-1.5 w-6 rounded-full bg-gold" /> Home tutoring in Tamale
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Expert home tutors who help your child{" "}
            <span className="relative whitespace-nowrap">
              truly understand
              <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 h-3 w-full text-gold" preserveAspectRatio="none" aria-hidden>
                <path d="M2 9 C 80 2, 200 2, 298 7" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            We match your child with a qualified, vetted tutor for in-home sessions — from Nursery to University,
            following the Ghana curriculum, BECE and WASSCE.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="btn-primary">
              Request a tutor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/teachers" className="btn-outline">Meet our tutors</Link>
          </div>
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-4 w-4 text-leaf" />
            Prefer to talk? Call or WhatsApp <span className="font-semibold text-foreground">{SITE.phones[0].display}</span>
          </a>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-foreground/80">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-leaf" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
