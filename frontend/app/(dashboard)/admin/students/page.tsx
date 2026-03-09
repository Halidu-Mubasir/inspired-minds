"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatsRow } from "@/components/shared/stats-row";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { UserCard } from "@/components/admin/user-card";
import { AddStudentSheet } from "@/components/admin/add-student-sheet";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/api/users";

const educationLevelOptions = [
  { value: "primary", label: "Primary" },
  { value: "jhs", label: "JHS" },
  { value: "shs", label: "SHS" },
  { value: "university", label: "University" },
  { value: "other", label: "Other" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filters.education_level) params.education_level = filters.education_level;
      const data = await usersApi.getStudents(params);
      setStudents(data.results);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents, search]);

  const active = students.filter((s) => s.is_active).length;
  const inactive = students.length - active;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        subtitle="Manage all student accounts and profiles."
        action={
          <Button
            size="sm"
            className="gap-1.5 bg-white text-slate-900 hover:bg-slate-100"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      <StatsRow
        stats={[
          { label: "Total", value: students.length, color: "blue" },
          { label: "Active", value: active, color: "green" },
          { label: "Inactive", value: inactive, color: "default" },
        ]}
      />

      <SearchFilterBar
        searchPlaceholder="Search students..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            key: "education_level",
            placeholder: "Education Level",
            options: educationLevelOptions,
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
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Add your first student to get started."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Student
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <UserCard
              key={student.id}
              user={student}
              basePath="/admin/students"
              onEdit={() => {}}
            />
          ))}
        </div>
      )}

      <AddStudentSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(user) => setStudents((prev) => [user, ...prev])}
      />
    </div>
  );
}
