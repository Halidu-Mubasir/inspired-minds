import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PairingStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import type { Pairing } from "@/lib/api/pairings";

interface PairingHistoryCardProps {
  pairings: Pairing[] | undefined;
  /** Which side of each pairing to name: the other party from the profile being viewed. */
  counterpart: "teacher" | "student";
  isLoading?: boolean;
  isError?: boolean;
}

export function PairingHistoryCard({ pairings, counterpart, isLoading, isError }: PairingHistoryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pairings{pairings ? ` (${pairings.length})` : ""}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : isError ? (
          <p className="text-sm text-destructive py-4 text-center">Couldn&apos;t load pairings.</p>
        ) : !pairings?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pairings yet.</p>
        ) : (
          <div className="space-y-2">
            {pairings.map((p) => {
              const person = p[counterpart];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
                >
                  <div>
                    <span className="font-medium">{person.first_name} {person.last_name}</span>
                    <span className="text-muted-foreground ml-2">· {p.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(p.start_date)}</span>
                    <PairingStatusBadge status={p.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
