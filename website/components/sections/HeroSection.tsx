import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0c2340 0%, #0d3461 50%, #0c2340 100%)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-white/80 font-medium mb-6">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            Ghana&apos;s Premier Home Tutoring Agency
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
            Expert Home Tutoring,{" "}
            <span className="text-sky-400">Tailored for Your Child</span>
          </h1>

          <p className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
            We connect students with qualified, vetted tutors for in-home sessions.
            From Primary to University level — we have the right tutor for every
            subject and every student.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-base px-8 py-3 transition-colors"
            >
              Find a Tutor
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/teachers"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 font-semibold text-base px-8 py-3 transition-colors"
            >
              Meet Our Tutors
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              All tutors fully vetted
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              Matched within 48 hours
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              In-home sessions across Accra
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
