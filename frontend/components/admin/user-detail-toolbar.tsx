"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountStatusButton, storeSavedUser } from "@/components/admin/account-status-button";
import { EditUserSheet } from "@/components/admin/edit-user-sheet";
import type { User } from "@/lib/api/users";

/** Back, Edit and Deactivate/Reactivate for an admin user detail page. */
export function UserDetailToolbar({ user, role }: { user: User; role: "teacher" | "student" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <AccountStatusButton user={user} role={role} />
      </div>
      <EditUserSheet
        user={editing ? user : null}
        role={role}
        onClose={() => setEditing(false)}
        onSaved={(saved) => storeSavedUser(queryClient, role, saved)}
      />
    </div>
  );
}
