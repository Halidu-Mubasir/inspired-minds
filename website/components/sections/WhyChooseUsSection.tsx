import { SectionHeader } from "@/components/common/SectionHeader";
import { ShieldCheck, Clock, Target, HeartHandshake, MonitorSmartphone } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Vetted & qualified tutors",
    description:
      "Every tutor passes qualification checks, a subject assessment and a panel interview before they teach.",
  },
  {
    icon: Target,
    title: "Personalised learning",
    description: "Sessions follow your child's curriculum, pace and learning style — never one-size-fits-all.",
  },
  {
    icon: Clock,
    title: "Flexible scheduling",
    description: "Choose the days, times and length of sessions that suit your family, and change them when life does.",
  },
  {
    icon: MonitorSmartphone,
    title: "A portal between lessons",
    description:
      "Students see lesson plans, homework and shared notes, message their tutor and practise with an AI study helper.",
  },
  {
    icon: HeartHandshake,
    title: "Ongoing agency support",
    description: "We stay involved. If you have a concern or want a different tutor, our team responds promptly.",
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="relative overflow-hidden bg-forest-deep py-20 lg:py-28">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,var(--gold),transparent)] opacity-16" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,var(--leaf),transparent)] opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          light
          eyebrow="Why Inspired Minds"
          title="More than a tutor directory"
          subtitle="A full-service agency that stays with your family and cares about results."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`rounded-3xl border border-white/10 bg-white/[0.04] p-7 ${i === 0 ? "lg:row-span-2 lg:flex lg:flex-col lg:justify-end lg:bg-white/[0.07]" : ""}`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-gold-foreground">
                <feature.icon className="h-6 w-6" />
              </span>
              <h3 className={`mt-5 font-bold text-white ${i === 0 ? "text-2xl" : "text-lg"}`}>{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
