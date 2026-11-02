"use client";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/card-grid-skeleton";
import { StudentCard } from "@/components/teacher/student-card";
import { pairingsApi } from "@/lib/api/pairings";
import { queryKeys } from "@/lib/query-keys";

export default function MyStudentsPage() {
  const query = useQuery({ queryKey: queryKeys.pairings.myStudents, queryFn: pairingsApi.getMyStudents });

  return (
    <div className="space-y-5">
      <PageHeader title="My Students" subtitle="Students currently assigned to you." />

      {query.isPending ? (
        <CardGridSkeleton count={4} cardClassName="h-36" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students assigned"
          description="Contact your admin to get paired with students."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {query.data.map((pairing) => (
            <StudentCard key={pairing.id} pairing={pairing} />
          ))}
        </div>
      )}
    </div>
  );
}
