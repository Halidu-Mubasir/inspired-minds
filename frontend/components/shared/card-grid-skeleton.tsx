import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardGridSkeletonProps {
  count?: number;
  /** Height class for each card, e.g. "h-44". */
  cardClassName?: string;
}

export function CardGridSkeleton({ count = 6, cardClassName = "h-44" }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("rounded-xl", cardClassName)} />
      ))}
    </div>
  );
}
