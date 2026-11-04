import { SectionHeader } from "@/components/common/SectionHeader";
import { GraduationCap, BookOpen, School, University, Baby } from "lucide-react";

const STUDENT_TYPES = [
  {
    icon: Baby,
    level: "Nursery & Kindergarten",
    tag: "Ages 2 – 6",
    description:
      "Learning through play — phonics, numbers, colours, shapes and social skills. We nurture curiosity and a love of learning from the start.",
  },
  {
    icon: School,
    level: "Primary",
    tag: "Ages 6 – 12",
    description:
      "Strong foundations in literacy, numeracy and science, taught with age-appropriate methods that make learning fun.",
  },
  {
    icon: BookOpen,
    level: "Junior High (JHS)",
    tag: "BECE preparation",
    description:
      "Targeted BECE support in Mathematics, English, Science, Social Studies and RME, building confidence for exam day.",
  },
  {
    icon: GraduationCap,
    level: "Senior High (SHS)",
    tag: "WASSCE preparation",
    description:
      "Core and elective subjects for WASSCE success, from tutors who know the Ghana Education Service curriculum.",
  },
  {
    icon: University,
    level: "University",
    tag: "Tertiary level",
    description:
      "Help with challenging first- and second-year modules in Mathematics, Sciences and Economics from tutors with advanced degrees.",
  },
];

export function StudentTypesSection() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Who we teach"
          title="The right support at every stage"
          subtitle="From a child's first letters to university modules, we match tutors to the level and the curriculum."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STUDENT_TYPES.map((type) => (
            <div
              key={type.level}
              className="group flex flex-col rounded-3xl border bg-card p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <type.icon className="h-6 w-6" />
              </span>
              <span className="mt-5 inline-flex w-fit rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
                {type.tag}
              </span>
              <h3 className="mt-3 text-lg font-bold text-foreground">{type.level}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
