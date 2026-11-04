import { GraduationCap } from "lucide-react";
import { Teacher } from "@/lib/data/teachers";
import { SubjectBadge } from "./SubjectBadge";

interface TutorCardProps {
  teacher: Teacher;
}

export function TutorCard({ teacher }: TutorCardProps) {
  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const visibleSubjects = teacher.subjects.slice(0, 4);
  const extraCount = teacher.subjects.length - 4;

  return (
    <article className="flex flex-col rounded-3xl border bg-card p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          {initials}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-foreground">{teacher.name}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-leaf" />
            {teacher.qualification} · {teacher.experience_years} {teacher.experience_years === 1 ? "year" : "years"} teaching
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{teacher.bio}</p>

      <div className="mt-5 flex flex-wrap gap-1.5 border-t pt-5">
        {visibleSubjects.map((s) => (
          <SubjectBadge key={s} subject={s} small />
        ))}
        {extraCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            +{extraCount} more
          </span>
        )}
      </div>
    </article>
  );
}
