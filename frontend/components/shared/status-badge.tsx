import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Pairing } from "@/lib/api/pairings";
import type { LessonDetail } from "@/lib/api/lessons";

const PAIRING_STATUS = {
  active: { label: "Active", className: "bg-success-soft text-success hover:bg-success-soft" },
  paused: { label: "Paused", className: "bg-warning-soft text-warning hover:bg-warning-soft" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground hover:bg-muted" },
} satisfies Record<Pairing["status"], { label: string; className: string }>;

const LESSON_STATUS = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground hover:bg-muted" },
  scheduled: { label: "Scheduled", className: "bg-info-soft text-info hover:bg-info-soft" },
  completed: { label: "Completed", className: "bg-success-soft text-success hover:bg-success-soft" },
  cancelled: { label: "Cancelled", className: "bg-danger-soft text-destructive hover:bg-danger-soft" },
} satisfies Record<LessonDetail["status"], { label: string; className: string }>;

interface StatusBadgeProps<S extends string> {
  status: S;
  className?: string;
}

// A dot as well as colour, so status never depends on colour alone.
function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />;
}

export function PairingStatusBadge({ status, className }: StatusBadgeProps<Pairing["status"]>) {
  const config = PAIRING_STATUS[status];
  return <Badge className={cn("gap-1.5 border-transparent text-xs", config.className, className)}><Dot />{config.label}</Badge>;
}

export function LessonStatusBadge({ status, className }: StatusBadgeProps<LessonDetail["status"]>) {
  const config = LESSON_STATUS[status];
  return <Badge className={cn("gap-1.5 border-transparent", config.className, className)}><Dot />{config.label}</Badge>;
}
