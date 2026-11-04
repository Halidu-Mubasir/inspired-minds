interface SubjectBadgeProps {
  subject: string;
  small?: boolean;
}

export function SubjectBadge({ subject, small = false }: SubjectBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-primary/15 bg-secondary font-medium text-secondary-foreground ${
        small ? "px-2.5 py-0.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      {subject}
    </span>
  );
}
