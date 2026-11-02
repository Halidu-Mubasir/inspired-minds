"use client";
import { cn } from "@/lib/utils";
import type { Subject } from "@/lib/api/subjects";

interface SubjectPickerProps {
  subjects: Subject[];
  value: string[];
  onChange: (names: string[]) => void;
}

/** Multi-select of subject names, shown as toggleable chips. */
export function SubjectPicker({ subjects, value, onChange }: SubjectPickerProps) {
  function toggle(name: string) {
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);
  }

  if (subjects.length === 0) {
    return <p className="text-xs text-muted-foreground">Loading subjects…</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.map((subject) => {
        const selected = value.includes(subject.name);
        return (
          <button
            key={subject.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(subject.name)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {subject.name}
          </button>
        );
      })}
    </div>
  );
}
