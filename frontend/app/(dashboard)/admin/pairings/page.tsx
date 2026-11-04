"use client";
import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatsRow } from "@/components/shared/stats-row";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { PairingCard } from "@/components/admin/pairing-card";
import { CreatePairingSheet } from "@/components/admin/create-pairing-sheet";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api/errors";
import { pairingsApi } from "@/lib/api/pairings";
import type { Pairing } from "@/lib/api/pairings";
import { queryKeys } from "@/lib/query-keys";

export default function PairingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const params: Record<string, string> = { page: String(page) };
  if (debouncedSearch) params.search = debouncedSearch;
  if (statusFilter) params.status = statusFilter;

  const list = useQuery({
    queryKey: queryKeys.pairings.list(params),
    queryFn: () => pairingsApi.getAll(params),
    placeholderData: keepPreviousData,
  });
  const stats = useQuery({ queryKey: queryKeys.pairings.stats, queryFn: pairingsApi.getStats });

  function refreshPairings() {
    queryClient.invalidateQueries({ queryKey: queryKeys.pairings.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
  }

  const endPairing = useMutation({
    mutationFn: (pairing: Pairing) => pairingsApi.end(pairing.id),
    onSuccess: () => {
      toast.success("Pairing ended");
      refreshPairings();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to end pairing")),
  });

  const togglePause = useMutation({
    mutationFn: (pairing: Pairing) =>
      pairingsApi.update(pairing.id, { status: pairing.status === "active" ? "paused" : "active" }),
    onSuccess: (updated) => {
      toast.success(updated.status === "paused" ? "Pairing paused" : "Pairing resumed");
      refreshPairings();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to update pairing")),
  });

  const pairings = list.data?.results ?? [];
  const isFiltered = !!debouncedSearch || !!statusFilter;
  const createButton = (
    <Button size="sm" onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4 mr-1" /> Create Pairing
    </Button>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pairings"
        subtitle="Manage teacher-student assignments."
        action={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Pairing
          </Button>
        }
      />

      {stats.data && (
        <StatsRow
          stats={[
            { label: "Active", value: stats.data.active, color: "green" },
            { label: "Paused", value: stats.data.paused, color: "amber" },
            { label: "Ended", value: stats.data.ended, color: "default" },
          ]}
        />
      )}

      <SearchFilterBar
        searchPlaceholder="Search by teacher, student, or subject..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filters={[
          {
            key: "status",
            placeholder: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "ended", label: "Ended" },
            ],
          },
        ]}
        filterValues={{ status: statusFilter }}
        onFilterChange={(_, value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      />

      {list.isPending ? (
        <CardGridSkeleton cardClassName="h-48" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : pairings.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No pairings found"
          description={
            isFiltered
              ? "Try adjusting your search or filter."
              : "Create your first pairing to assign a teacher to a student."
          }
          action={isFiltered ? undefined : createButton}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pairings.map((pairing) => (
              <PairingCard
                key={pairing.id}
                pairing={pairing}
                onEnd={(p) => endPairing.mutate(p)}
                onPause={(p) => togglePause.mutate(p)}
              />
            ))}
          </div>
          <PaginationControls page={page} count={list.data.count} onPageChange={setPage} />
        </>
      )}

      <CreatePairingSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refreshPairings}
      />
    </div>
  );
}
