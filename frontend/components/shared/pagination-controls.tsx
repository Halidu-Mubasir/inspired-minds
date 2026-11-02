import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/constants";

interface PaginationControlsProps {
  page: number;
  count: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

/** Previous/next paging for DRF page-number lists. Renders nothing for a single page. */
export function PaginationControls({ page, count, onPageChange, pageSize = PAGE_SIZE }: PaginationControlsProps) {
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  if (pageCount <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
      <span>
        Showing {first}–{last} of {count}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span>
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
