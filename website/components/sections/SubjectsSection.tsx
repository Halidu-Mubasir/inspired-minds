import Link from "next/link";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import { SUBJECTS } from "@/lib/data/subjects";
import { ArrowRight } from "lucide-react";

export function SubjectsSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Subjects We Cover"
          subtitle="Our tutors specialise across a comprehensive range of subjects at all curriculum levels."
        />

        <div className="mt-12 flex flex-wrap gap-3 justify-center">
          {SUBJECTS.map((subject) => (
            <SubjectBadge key={subject} subject={subject} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/teachers"
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-base px-8 py-3 transition-colors"
          >
            Meet Our Tutors
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
