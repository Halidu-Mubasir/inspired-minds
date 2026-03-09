"use client";
import { useEffect, useState, useCallback } from "react";
import { Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsRow } from "@/components/shared/stats-row";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PairingCard } from "@/components/admin/pairing-card";
import { CreatePairingSheet } from "@/components/admin/create-pairing-sheet";
import { pairingsApi } from "@/lib/api/pairings";
import type { Pairing } from "@/lib/api/pairings";

export default function PairingsPage() {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPairings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      const data = await pairingsApi.getAll(params);
      const results = data.results;
      if (search) {
        const q = search.toLowerCase();
        setPairings(
          results.filter(
            (p) =>
              p.subject.toLowerCase().includes(q) ||
              `${p.teacher.first_name} ${p.teacher.last_name}`.toLowerCase().includes(q) ||
              `${p.student.first_name} ${p.student.last_name}`.toLowerCase().includes(q)
          )
        );
      } else {
        setPairings(results);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchPairings, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchPairings, search]);

  async function handleEnd(pairing: Pairing) {
    try {
      await pairingsApi.end(pairing.id);
      setPairings((prev) =>
        prev.map((p) => (p.id === pairing.id ? { ...p, status: "ended" } : p))
      );
      toast.success("Pairing ended");
    } catch {
      toast.error("Failed to end pairing");
    }
  }

  async function handlePause(pairing: Pairing) {
    const newStatus = pairing.status === "active" ? "paused" : "active";
    try {
      await pairingsApi.update(pairing.id, { status: newStatus });
      setPairings((prev) =>
        prev.map((p) => (p.id === pairing.id ? { ...p, status: newStatus } : p))
      );
      toast.success(newStatus === "paused" ? "Pairing paused" : "Pairing resumed");
    } catch {
      toast.error("Failed to update pairing");
    }
  }

  const active = pairings.filter((p) => p.status === "active").length;
  const paused = pairings.filter((p) => p.status === "paused").length;
  const ended = pairings.filter((p) => p.status === "ended").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pairings"
        subtitle="Manage teacher-student assignments."
        action={
          <Button
            size="sm"
            className="gap-1.5 bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Pairing
          </Button>
        }
      />

      <StatsRow
        stats={[
          { label: "Active", value: active, color: "green" },
          { label: "Paused", value: paused, color: "amber" },
          { label: "Ended", value: ended, color: "default" },
        ]}
      />

      <SearchFilterBar
        searchPlaceholder="Search by teacher, student, or subject..."
        searchValue={search}
        onSearchChange={setSearch}
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
        filterValues={filters}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : pairings.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No pairings found"
          description="Create your first pairing to assign a teacher to a student."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Pairing
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pairings.map((pairing) => (
            <PairingCard
              key={pairing.id}
              pairing={pairing}
              onEnd={handleEnd}
              onPause={handlePause}
            />
          ))}
        </div>
      )}

      <CreatePairingSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(pairing) => setPairings((prev) => [pairing, ...prev])}
      />
    </div>
  );
}
