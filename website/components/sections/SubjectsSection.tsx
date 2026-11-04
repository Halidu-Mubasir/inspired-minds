import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { SubjectBadge } from "@/components/common/SubjectBadge";
import { SUBJECTS } from "@/lib/data/subjects";

export function SubjectsSection() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div>
          <SectionHeader
            centered={false}
            eyebrow="Subjects"
            title="Tutors for every subject on the timetable"
            subtitle="Core and elective subjects at every curriculum level. Don't see yours? Ask us — we'll find the right tutor."
          />
          <Link href="/teachers" className="btn-primary mt-8">
            Meet our tutors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {SUBJECTS.map((subject) => (
            <li key={subject}><SubjectBadge subject={subject} /></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
