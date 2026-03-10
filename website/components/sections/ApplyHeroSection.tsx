import { Clock, Banknote, HeartHandshake } from "lucide-react";

const BENEFITS = [
  { icon: Clock, label: "Flexible Hours" },
  { icon: Banknote, label: "Competitive Rates" },
  { icon: HeartHandshake, label: "Agency Support" },
];

export function ApplyHeroSection() {
  return (
    <section
      className="relative py-20"
      style={{
        background: "linear-gradient(135deg, #0c2340 0%, #0d3461 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Join Our Team of Expert Tutors
        </h1>
        <p className="mt-4 text-lg text-white/75 max-w-2xl mx-auto">
          Share your knowledge, earn on your own schedule, and make a real
          difference in students&apos; lives. Inspired Minds handles the admin —
          you just teach.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm text-white font-medium"
            >
              <Icon className="h-4 w-4 text-sky-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
