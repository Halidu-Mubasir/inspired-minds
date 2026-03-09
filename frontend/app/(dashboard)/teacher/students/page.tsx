"use client";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentCard } from "@/components/teacher/student-card";
import { pairingsApi } from "@/lib/api/pairings";
import type { Pairing } from "@/lib/api/pairings";

export default function MyStudentsPage() {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pairingsApi
      .getMyStudents()
      .then(setPairings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Students"
        subtitle="Students currently assigned to you."
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : pairings.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students assigned"
          description="Contact your admin to get paired with students."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pairings.map((pairing) => (
            <StudentCard key={pairing.id} pairing={pairing} />
          ))}
        </div>
      )}
    </div>
  );
}
