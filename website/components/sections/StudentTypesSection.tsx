import { SectionHeader } from "@/components/common/SectionHeader";
import { GraduationCap, BookOpen, School, University, Baby } from "lucide-react";

const STUDENT_TYPES = [
  {
    icon: Baby,
    level: "Nursery & Kindergarten",
    ages: "Ages 2 – 6",
    description:
      "Early childhood learning through play — phonics, number recognition, colours, shapes, and social skills. Our tutors nurture curiosity and build a love of learning from the very start.",
    color: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-500",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  {
    icon: School,
    level: "Primary",
    ages: "Ages 6 – 12",
    description:
      "Building strong foundational skills in literacy, numeracy, and science. Our tutors use age-appropriate methods to make learning fun and effective for young learners.",
    color: "bg-emerald-50 border-emerald-200",
    iconColor: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: BookOpen,
    level: "Junior High (JHS)",
    ages: "BECE Preparation",
    description:
      "Targeted support for the BECE curriculum including Mathematics, English, Science, Social Studies, and RME. We help students build confidence and score high.",
    color: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-600",
    badgeColor: "bg-sky-100 text-sky-700",
  },
  {
    icon: GraduationCap,
    level: "Senior High (SHS)",
    ages: "WASSCE Preparation",
    description:
      "Comprehensive tutoring across core and elective subjects for WASSCE success. Our SHS tutors are well-versed in the Ghana Education Service curriculum.",
    color: "bg-violet-50 border-violet-200",
    iconColor: "text-violet-600",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    icon: University,
    level: "University",
    ages: "Tertiary Level",
    description:
      "Support for first and second-year university students with challenging modules in Mathematics, Sciences, and Economics. Learn from tutors with advanced degrees.",
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];

export function StudentTypesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Who We Teach"
          subtitle="We support students at every stage of their academic journey, from Nursery through University."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STUDENT_TYPES.map((type) => (
            <div
              key={type.level}
              className={`rounded-2xl border p-6 ${type.color}`}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white mb-4 shadow-sm`}
              >
                <type.icon className={`h-6 w-6 ${type.iconColor}`} />
              </div>
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${type.badgeColor}`}
              >
                {type.ages}
              </span>
              <h3 className="font-bold text-[#0c2340] text-lg mb-2">{type.level}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
