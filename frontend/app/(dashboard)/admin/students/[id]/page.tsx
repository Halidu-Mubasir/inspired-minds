"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PairingHistoryCard } from "@/components/admin/pairing-history-card";
import { DetailPageError, DetailPageSkeleton } from "@/components/shared/detail-page-states";
import { getInitials } from "@/lib/utils";
import { EDUCATION_LEVEL_LABELS, usersApi } from "@/lib/api/users";
import { pairingsApi } from "@/lib/api/pairings";
import { queryKeys } from "@/lib/query-keys";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const studentQuery = useQuery({ queryKey: queryKeys.students.detail(id), queryFn: () => usersApi.getStudent(id) });
  const pairingParams = { student: id, page_size: "100" };
  const pairingsQuery = useQuery({
    queryKey: queryKeys.pairings.list(pairingParams),
    queryFn: () => pairingsApi.getAll(pairingParams),
  });

  if (studentQuery.isPending) return <DetailPageSkeleton />;
  if (studentQuery.isError) {
    return <DetailPageError error={studentQuery.error} noun="Student" onRetry={() => studentQuery.refetch()} />;
  }

  const student = studentQuery.data;
  const profile = student.student_profile;

  return (
    <div className="space-y-5 max-w-3xl">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={student.avatar ?? undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                {getInitials(student.first_name, student.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">
                  {student.first_name} {student.last_name}
                </h2>
                <Badge
                  className={
                    student.is_active
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : ""
                  }
                  variant={student.is_active ? "default" : "secondary"}
                >
                  {student.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {student.email}
                </span>
                {student.phone_number && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {student.phone_number}
                  </span>
                )}
              </div>
              {profile?.subjects_of_interest && profile.subjects_of_interest.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {profile.subjects_of_interest.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Education Level</p>
                  <p className="font-medium">
                    {profile.education_level ? EDUCATION_LEVEL_LABELS[profile.education_level] : "—"}
                  </p>
                </div>
                {profile.school_name && (
                  <div>
                    <p className="text-muted-foreground text-xs">School</p>
                    <p className="font-medium">{profile.school_name}</p>
                  </div>
                )}
                {profile.grade_or_year && (
                  <div>
                    <p className="text-muted-foreground text-xs">Grade / Year</p>
                    <p className="font-medium">{profile.grade_or_year}</p>
                  </div>
                )}
              </div>

              {(profile.parent_guardian_name || profile.parent_guardian_phone || profile.parent_guardian_email) && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Parent / Guardian</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    {profile.parent_guardian_name && (
                      <div>
                        <p className="text-muted-foreground text-xs">Name</p>
                        <p>{profile.parent_guardian_name}</p>
                      </div>
                    )}
                    {profile.parent_guardian_phone && (
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <p>{profile.parent_guardian_phone}</p>
                      </div>
                    )}
                    {profile.parent_guardian_email && (
                      <div>
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p>{profile.parent_guardian_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PairingHistoryCard
        pairings={pairingsQuery.data?.results}
        counterpart="teacher"
        isLoading={pairingsQuery.isPending}
        isError={pairingsQuery.isError}
      />
    </div>
  );
}
