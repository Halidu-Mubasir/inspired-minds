"use client";
import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatsRow } from "@/components/shared/stats-row";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { UserCard } from "@/components/admin/user-card";
import { AddTeacherSheet } from "@/components/admin/add-teacher-sheet";
import { AddStudentSheet } from "@/components/admin/add-student-sheet";
import { EditUserSheet } from "@/components/admin/edit-user-sheet";
import { storeSavedUser } from "@/components/admin/account-status-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

type FilterConfig = {
  /** API query parameter, e.g. "is_available". */
  key: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

const STATUS_FILTER: FilterConfig = {
  key: "is_active",
  placeholder: "Status",
  options: [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ],
};

const ROLE_CONFIG = {
  teacher: {
    keys: queryKeys.teachers,
    fetchList: usersApi.getTeachers,
    noun: "teacher",
    basePath: "/admin/teachers",
    AddSheet: AddTeacherSheet,
    stats: (s: { total_teachers: number; inactive_teachers: number }) => [s.total_teachers, s.inactive_teachers],
  },
  student: {
    keys: queryKeys.students,
    fetchList: usersApi.getStudents,
    noun: "student",
    basePath: "/admin/students",
    AddSheet: AddStudentSheet,
    stats: (s: { total_students: number; inactive_students: number }) => [s.total_students, s.inactive_students],
  },
} as const;

interface UserDirectoryProps {
  role: keyof typeof ROLE_CONFIG;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  filters?: FilterConfig[];
}

/** Admin list of teachers or students: server-side search, filters and pagination. */
export function UserDirectory({ role, title, subtitle, icon, filters = [] }: UserDirectoryProps) {
  const config = ROLE_CONFIG[role];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const params: Record<string, string> = { page: String(page) };
  if (debouncedSearch) params.search = debouncedSearch;
  for (const [key, value] of Object.entries(filterValues)) if (value) params[key] = value;

  const list = useQuery({
    queryKey: config.keys.list(params),
    queryFn: () => config.fetchList(params),
    placeholderData: keepPreviousData,
  });
  const stats = useQuery({ queryKey: queryKeys.dashboardStats, queryFn: usersApi.getDashboardStats });
  const [active, inactive] = stats.data ? config.stats(stats.data) : [0, 0];

  function handleCreated() {
    queryClient.invalidateQueries({ queryKey: config.keys.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
  }

  const addButton = (
    <Button size="sm" onClick={() => setAddOpen(true)}>
      <Plus className="h-4 w-4 mr-1" /> Add {config.noun}
    </Button>
  );
  const users = list.data?.results ?? [];
  const isFiltered = !!debouncedSearch || Object.values(filterValues).some(Boolean);

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button
            size="sm"
            className="gap-1.5 capitalize"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add {config.noun}
          </Button>
        }
      />

      {stats.data && (
        <StatsRow
          stats={[
            { label: "Total", value: active + inactive, color: "blue" },
            { label: "Active", value: active, color: "green" },
            { label: "Inactive", value: inactive, color: "default" },
          ]}
        />
      )}

      <SearchFilterBar
        searchPlaceholder={`Search ${config.noun}s by name or email...`}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        filters={[...filters, STATUS_FILTER]}
        filterValues={filterValues}
        onFilterChange={(key, value) => {
          setFilterValues((prev) => ({ ...prev, [key]: value }));
          setPage(1);
        }}
      />

      {list.isPending ? (
        <CardGridSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={icon}
          title={`No ${config.noun}s found`}
          description={isFiltered ? "Try adjusting your search or filters." : `Add your first ${config.noun} to get started.`}
          action={isFiltered ? undefined : addButton}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <UserCard key={user.id} user={user} basePath={config.basePath} onEdit={setEditing} />
            ))}
          </div>
          <PaginationControls page={page} count={list.data.count} onPageChange={setPage} />
        </>
      )}

      <config.AddSheet open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
      <EditUserSheet
        user={editing}
        role={role}
        onClose={() => setEditing(null)}
        onSaved={(saved) => storeSavedUser(queryClient, role, saved)}
      />
    </div>
  );
}
