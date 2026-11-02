"use client";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { ResourceCard } from "@/components/resources/resource-card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { resourcesApi, RESOURCE_TYPE_LABELS } from "@/lib/api/resources";
import type { Resource } from "@/lib/api/resources";
import { queryKeys } from "@/lib/query-keys";

const TYPE_FILTER = {
  key: "resource_type",
  placeholder: "All types",
  options: Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
};

interface ResourceBrowserProps {
  /** "resources": what the user can see (their pairings, uploads, library). "library": the shared library only. */
  source: "resources" | "library";
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
  searchPlaceholder?: string;
  canDelete?: (resource: Resource) => boolean;
  onDeleted?: () => void;
}

/** Searchable, type-filterable, paginated grid of resources. */
export function ResourceBrowser({
  source,
  icon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  searchPlaceholder = "Search by title, subject or description...",
  canDelete,
  onDeleted,
}: ResourceBrowserProps) {
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const params: Record<string, string> = { page: String(page) };
  if (debouncedSearch) params.search = debouncedSearch;
  if (resourceType) params.resource_type = resourceType;

  const list = useQuery({
    queryKey: source === "library" ? queryKeys.resources.library(params) : queryKeys.resources.list(params),
    queryFn: () => (source === "library" ? resourcesApi.getLibrary(params) : resourcesApi.getAll(params)),
    placeholderData: keepPreviousData,
  });
  const resources = list.data?.results ?? [];
  const isFiltered = !!debouncedSearch || !!resourceType;

  return (
    <div className="space-y-4">
      <SearchFilterBar
        searchPlaceholder={searchPlaceholder}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filters={[TYPE_FILTER]}
        filterValues={{ resource_type: resourceType }}
        onFilterChange={(_, value) => {
          setResourceType(value);
          setPage(1);
        }}
      />

      {list.isPending ? (
        <CardGridSkeleton count={3} cardClassName="h-40" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={icon}
          title={isFiltered ? "No results" : emptyTitle}
          description={isFiltered ? "Try adjusting your search or filter." : emptyDescription}
          action={isFiltered ? undefined : emptyAction}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} canDelete={canDelete?.(r) ?? false} onDeleted={onDeleted} />
            ))}
          </div>
          <PaginationControls page={page} count={list.data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
