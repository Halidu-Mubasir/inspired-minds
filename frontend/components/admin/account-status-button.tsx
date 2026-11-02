"use client";
import { useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api/errors";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

type Role = "teacher" | "student";

/** Put an edited user into the cache and refresh everything that lists or counts users. */
export function storeSavedUser(queryClient: QueryClient, role: Role, user: User) {
  const keys = role === "teacher" ? queryKeys.teachers : queryKeys.students;
  queryClient.setQueryData(keys.detail(user.id), user);
  queryClient.invalidateQueries({ queryKey: [keys.all[0], "list"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
  // Deactivation pauses pairings.
  queryClient.invalidateQueries({ queryKey: queryKeys.pairings.all });
}

/** Deactivate (with confirmation) or reactivate an account. */
export function AccountStatusButton({ user, role }: { user: User; role: Role }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const name = `${user.first_name} ${user.last_name}`;

  async function setActive(isActive: boolean) {
    setSaving(true);
    try {
      const update = role === "teacher" ? usersApi.updateTeacher : usersApi.updateStudent;
      const saved = await update(user.id, { is_active: isActive });
      storeSavedUser(queryClient, role, saved);
      toast.success(isActive ? `${name} reactivated` : `${name} deactivated`);
      setConfirming(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update account"));
    } finally {
      setSaving(false);
    }
  }

  if (!user.is_active) {
    return (
      <Button size="sm" variant="outline" disabled={saving} onClick={() => setActive(true)}>
        {saving ? "Reactivating..." : "Reactivate"}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        Deactivate
      </Button>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {name}?</DialogTitle>
            <DialogDescription>
              They will be signed out everywhere and can&apos;t log in, and their active pairings will be
              paused. Their lessons, files and messages are kept, and you can reactivate the account later
              (pairings stay paused until you resume them).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="destructive" disabled={saving} onClick={() => setActive(false)}>
              {saving ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
