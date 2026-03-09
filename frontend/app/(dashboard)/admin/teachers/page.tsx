"use client";
import { useEffect, useState, useCallback } from "react";
import { UserCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsRow } from "@/components/shared/stats-row";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { UserCard } from "@/components/admin/user-card";
import { AddTeacherSheet } from "@/components/admin/add-teacher-sheet";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/api/users";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filters.availability === "available") params.is_available = "true";
      if (filters.availability === "unavailable") params.is_available = "false";
      const data = await usersApi.getTeachers(params);
      setTeachers(data.results);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchTeachers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchTeachers, search]);

  const active = teachers.filter((t) => t.is_active).length;
  const inactive = teachers.length - active;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teachers"
        subtitle="Manage all teacher accounts and profiles."
        action={
          <Button
            size="sm"
            className="gap-1.5 bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <StatsRow
        stats={[
          { label: "Total", value: teachers.length, color: "blue" },
          { label: "Active", value: active, color: "green" },
          { label: "Inactive", value: inactive, color: "default" },
        ]}
      />

      <SearchFilterBar
        searchPlaceholder="Search teachers..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            key: "availability",
            placeholder: "Availability",
            options: [
              { value: "available", label: "Available" },
              { value: "unavailable", label: "Unavailable" },
            ],
          },
        ]}
        filterValues={filters}
        onFilterChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No teachers found"
          description="Add your first teacher to get started."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Teacher
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <UserCard
              key={teacher.id}
              user={teacher}
              basePath="/admin/teachers"
              onEdit={() => {}}
            />
          ))}
        </div>
      )}

      <AddTeacherSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(user) => setTeachers((prev) => [user, ...prev])}
      />
    </div>
  );
}
