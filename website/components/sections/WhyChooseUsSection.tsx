import { SectionHeader } from "@/components/common/SectionHeader";
import { ShieldCheck, Clock, Target, HeartHandshake } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Vetted & Qualified Tutors",
    description:
      "Every tutor undergoes a rigorous vetting process — qualification checks, subject assessments, and a panel interview. You only get the best.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Sessions happen on your terms. Choose the days, times, and duration that suit your family's schedule. We accommodate changes without hassle.",
  },
  {
    icon: Target,
    title: "Personalised Learning",
    description:
      "Our tutors tailor each session to your child's specific curriculum, pace, and learning style — not a one-size-fits-all approach.",
  },
  {
    icon: HeartHandshake,
    title: "Ongoing Agency Support",
    description:
      "We stay involved throughout the process. If you have concerns or need a tutor change, our team is always here to help and respond promptly.",
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Why Choose Inspired Minds?"
          subtitle="We're not just a tutoring directory — we're a full-service agency that cares about results."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-[#0c2340] text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
