import { SectionHeader } from "@/components/common/SectionHeader";
import { MessageSquare, Users, BookOpen } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Contact Us",
    description:
      "Tell us about your child's level, the subjects they need help with, and your preferred schedule. We'll listen and understand your needs.",
  },
  {
    icon: Users,
    step: "02",
    title: "Get Matched",
    description:
      "We match you with a qualified, vetted tutor who specialises in the required subjects and suits your child's learning style — within 48 hours.",
  },
  {
    icon: BookOpen,
    step: "03",
    title: "Start Learning",
    description:
      "Your tutor comes to your home at the agreed time. Sessions are structured, engaging, and tailored to your child's curriculum and goals.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="How It Works"
          subtitle="Getting started with Inspired Minds is simple and straightforward."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-8 left-[calc(50%+2rem)] right-0 h-px bg-sky-100 hidden md:block" />
              )}

              {/* Icon circle */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 border-2 border-sky-100 mb-6">
                <step.icon className="h-7 w-7 text-sky-500" />
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                  {step.step}
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#0c2340] mb-3">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
