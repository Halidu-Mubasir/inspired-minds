"use client";
import { UserCheck } from "lucide-react";
import { UserDirectory } from "@/components/admin/user-directory";

export default function TeachersPage() {
  return (
    <UserDirectory
      role="teacher"
      title="Teachers"
      subtitle="Manage all teacher accounts and profiles."
      icon={UserCheck}
      filters={[
        {
          key: "is_available",
          placeholder: "Availability",
          options: [
            { value: "true", label: "Available" },
            { value: "false", label: "Unavailable" },
          ],
        },
      ]}
    />
  );
}
