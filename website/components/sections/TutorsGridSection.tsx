import { TutorCard } from "@/components/common/TutorCard";
import { TEACHERS } from "@/lib/data/teachers";

export function TutorsGridSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEACHERS.map((teacher, i) => (
            <TutorCard key={teacher.id} teacher={teacher} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
