interface SubjectBadgeProps {
  subject: string;
  small?: boolean;
}

export function SubjectBadge({ subject, small = false }: SubjectBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 font-medium border border-sky-200 ${
        small ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {subject}
    </span>
  );
}
