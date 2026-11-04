import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  /** Makes the whole card a link to the page behind the number. */
  href?: string;
  /** Draws attention to a number that needs action (e.g. unread messages). */
  highlight?: boolean;
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, href, highlight, className }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-gold text-gold-foreground" : "bg-secondary text-primary"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-2 truncate text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {description && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{description}</span>
          {href && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />}
        </p>
      )}
    </>
  );
  const classes = cn("group block rounded-xl border bg-card p-5 shadow-xs transition", className);

  return href ? (
    <Link href={href} className={cn(classes, "hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring")}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
