import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

/** Shown when a query fails, so a network or server error is never mistaken for "no data". */
export function ErrorState({ error, title = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-destructive/10 rounded-full p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {getErrorMessage(error, "We couldn't load this. Check your connection and try again.")}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
