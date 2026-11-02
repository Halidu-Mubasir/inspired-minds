import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Pairing } from "@/lib/api/pairings";
import type { LessonDetail } from "@/lib/api/lessons";

const PAIRING_STATUS = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground hover:bg-muted" },
} satisfies Record<Pairing["status"], { label: string; className: string }>;

const LESSON_STATUS = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground hover:bg-muted" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
} satisfies Record<LessonDetail["status"], { label: string; className: string }>;

interface StatusBadgeProps<S extends string> {
  status: S;
  className?: string;
}

export function PairingStatusBadge({ status, className }: StatusBadgeProps<Pairing["status"]>) {
  const config = PAIRING_STATUS[status];
  return <Badge className={cn("text-xs", config.className, className)}>{config.label}</Badge>;
}

export function LessonStatusBadge({ status, className }: StatusBadgeProps<LessonDetail["status"]>) {
  const config = LESSON_STATUS[status];
  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
