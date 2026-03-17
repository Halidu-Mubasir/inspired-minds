import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

export const AGENCY_SUBJECTS = [
  "Mathematics",
  "English Language",
  "Integrated Science",
  "Social Studies",
  "Biology",
  "Chemistry",
  "Physics",
  "Elective Mathematics",
  "Economics",
  "Business Management",
  "Financial Accounting",
  "Geography",
  "History",
  "Government",
  "Literature in English",
  "French",
  "ICT / Computing",
  "Religious and Moral Education (RME)",
] as const;

interface SubjectsMultiSelectProps {
  value: string[];
  onChange: (subjects: string[]) => void;
}

export function SubjectsMultiSelect({ value, onChange }: SubjectsMultiSelectProps) {
  function toggle(subject: string) {
    if (value.includes(subject)) {
      onChange(value.filter((s) => s !== subject));
    } else {
      onChange([...value, subject]);
    }
  }

  return (
    <div className="space-y-2">
      <ScrollArea className="h-44 rounded-md border p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {AGENCY_SUBJECTS.map((subject) => (
            <div key={subject} className="flex items-center gap-2">
              <Checkbox
                id={`subject-${subject}`}
                checked={value.includes(subject)}
                onCheckedChange={() => toggle(subject)}
              />
              <Label
                htmlFor={`subject-${subject}`}
                className="text-sm font-normal cursor-pointer leading-tight"
              >
                {subject}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">
        {value.length === 0
          ? "No subjects selected"
          : `${value.length} subject${value.length !== 1 ? "s" : ""} selected`}
      </p>
    </div>
  );
}
