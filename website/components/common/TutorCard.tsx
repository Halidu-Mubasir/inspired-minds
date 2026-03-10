import { Teacher } from "@/lib/data/teachers";
import { SubjectBadge } from "./SubjectBadge";

const AVATAR_COLORS = [
  "bg-sky-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-orange-600",
];

const QUAL_COLORS: Record<string, string> = {
  "HND": "bg-blue-50 text-blue-700 border-blue-200",
  "Bachelor's Degree": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Master's Degree": "bg-violet-50 text-violet-700 border-violet-200",
  "PhD": "bg-amber-50 text-amber-700 border-amber-200",
};

interface TutorCardProps {
  teacher: Teacher;
  index: number;
}

export function TutorCard({ teacher, index }: TutorCardProps) {
  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const qualColor = QUAL_COLORS[teacher.qualification] ?? "bg-gray-50 text-gray-700 border-gray-200";
  const visibleSubjects = teacher.subjects.slice(0, 4);
  const extraCount = teacher.subjects.length - 4;

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`h-14 w-14 rounded-full ${avatarColor} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-[#0c2340] text-lg leading-tight">
            {teacher.name}
          </h3>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium mt-1 ${qualColor}`}
          >
            {teacher.qualification}
          </span>
        </div>
      </div>

      {/* Experience */}
      <p className="text-sm text-gray-500 mb-3">
        <span className="font-semibold text-gray-700">
          {teacher.experience_years} {teacher.experience_years === 1 ? "year" : "years"}
        </span>{" "}
        of teaching experience
      </p>

      {/* Subjects */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {visibleSubjects.map((s) => (
          <SubjectBadge key={s} subject={s} small />
        ))}
        {extraCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5">
            +{extraCount} more
          </span>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
        {teacher.bio}
      </p>
    </div>
  );
}
