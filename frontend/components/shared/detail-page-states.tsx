import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { isNotFound } from "@/lib/api/errors";

export function DetailPageSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

/** "Not found" only for a real 404; any other failure gets an error with a retry. */
export function DetailPageError({ error, noun, onRetry }: { error: unknown; noun: string; onRetry: () => void }) {
  if (isNotFound(error)) {
    return <div className="text-center py-16 text-muted-foreground">{noun} not found.</div>;
  }
  return <ErrorState error={error} title={`Couldn't load this ${noun.toLowerCase()}`} onRetry={onRetry} />;
}
