"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import type { Pairing } from "@/lib/api/pairings";

interface PairingCardProps {
  pairing: Pairing;
  onEnd?: (pairing: Pairing) => void;
  onPause?: (pairing: Pairing) => void;
}

const statusConfig = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

function UserPill({ user }: { user: Pairing["teacher"] | Pairing["student"] }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {getInitials(user.first_name, user.last_name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium text-center leading-tight max-w-20">
        {user.first_name} {user.last_name}
      </span>
    </div>
  );
}

export function PairingCard({ pairing, onEnd, onPause }: PairingCardProps) {
  const status = statusConfig[pairing.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {pairing.subject}
          </Badge>
          <Badge className={`text-xs ${status.className}`}>{status.label}</Badge>
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          <UserPill user={pairing.teacher} />
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <UserPill user={pairing.student} />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Started {formatDate(pairing.start_date)}
        </p>

        {pairing.status === "active" && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onPause?.(pairing)}
            >
              Pause
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-xs text-destructive hover:text-destructive"
              onClick={() => onEnd?.(pairing)}
            >
              End
            </Button>
          </div>
        )}
        {pairing.status === "paused" && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onPause?.(pairing)}
            >
              Resume
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-xs text-destructive hover:text-destructive"
              onClick={() => onEnd?.(pairing)}
            >
              End
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
