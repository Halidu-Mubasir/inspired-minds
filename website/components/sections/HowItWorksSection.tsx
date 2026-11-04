import Link from "next/link";
import { ArrowRight, MessageSquare, Users, BookOpen } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Tell us what your child needs",
    description:
      "Share your child's level, the subjects they need help with and the days that suit you. A short form or a phone call is all it takes.",
  },
  {
    icon: Users,
    title: "We match a vetted tutor",
    description:
      "Within 48 hours we match you with a qualified tutor who specialises in the subject and suits your child's learning style.",
  },
  {
    icon: BookOpen,
    title: "Lessons start at home",
    description:
      "Your tutor comes to you at the agreed time. Lesson plans, homework and notes are shared in the student portal after each session.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How it works" title="Three simple steps to the right tutor" />

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-3xl border bg-card p-8 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <step.icon className="h-6 w-6" />
                </span>
                <span className="font-display text-5xl font-semibold text-gold/70">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link href="/contact" className="btn-primary">
            Start with step one <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
