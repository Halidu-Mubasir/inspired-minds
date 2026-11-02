"use client";
import { Users } from "lucide-react";
import { UserDirectory } from "@/components/admin/user-directory";
import { EDUCATION_LEVEL_LABELS } from "@/lib/api/users";

export default function StudentsPage() {
  return (
    <UserDirectory
      role="student"
      title="Students"
      subtitle="Manage all student accounts and profiles."
      icon={Users}
      filters={[
        {
          key: "education_level",
          placeholder: "Education Level",
          options: Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}
