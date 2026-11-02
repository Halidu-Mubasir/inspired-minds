"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserDetailToolbar } from "@/components/admin/user-detail-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PairingHistoryCard } from "@/components/admin/pairing-history-card";
import { DetailPageError, DetailPageSkeleton } from "@/components/shared/detail-page-states";
import { getInitials, formatDate } from "@/lib/utils";
import { usersApi } from "@/lib/api/users";
import { pairingsApi } from "@/lib/api/pairings";
import { queryKeys } from "@/lib/query-keys";

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teacherQuery = useQuery({ queryKey: queryKeys.teachers.detail(id), queryFn: () => usersApi.getTeacher(id) });
  const pairingParams = { teacher: id, page_size: "100" };
  const pairingsQuery = useQuery({
    queryKey: queryKeys.pairings.list(pairingParams),
    queryFn: () => pairingsApi.getAll(pairingParams),
  });

  if (teacherQuery.isPending) return <DetailPageSkeleton />;
  if (teacherQuery.isError) {
    return <DetailPageError error={teacherQuery.error} noun="Teacher" onRetry={() => teacherQuery.refetch()} />;
  }

  const teacher = teacherQuery.data;
  const profile = teacher.teacher_profile;

  return (
    <div className="space-y-5 max-w-3xl">
      <UserDetailToolbar user={teacher} role="teacher" />

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={teacher.avatar ?? undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                {getInitials(teacher.first_name, teacher.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">
                  {teacher.first_name} {teacher.last_name}
                </h2>
                <Badge
                  className={
                    teacher.is_active
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : ""
                  }
                  variant={teacher.is_active ? "default" : "secondary"}
                >
                  {teacher.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {teacher.email}
                </span>
                {teacher.phone_number && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {teacher.phone_number}
                  </span>
                )}
                {teacher.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {teacher.address}
                  </span>
                )}
              </div>

              {profile?.subjects && profile.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {profile.subjects.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Experience</p>
                  <p className="font-medium">{profile.years_of_experience} yrs</p>
                </div>
                {profile.hourly_rate && (
                  <div>
                    <p className="text-muted-foreground text-xs">Hourly Rate</p>
                    <p className="font-medium">GHS {profile.hourly_rate}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Availability</p>
                  <p className="font-medium">{profile.is_available ? "Available" : "Unavailable"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Joined</p>
                  <p className="font-medium">{formatDate(teacher.created_at)}</p>
                </div>
              </div>
              {profile.qualifications && (
                <div className="mt-3 text-sm">
                  <p className="text-muted-foreground text-xs">Qualifications</p>
                  <p className="mt-0.5">{profile.qualifications}</p>
                </div>
              )}
              {profile.bio && (
                <div className="mt-3 text-sm">
                  <p className="text-muted-foreground text-xs">Bio</p>
                  <p className="mt-0.5 text-foreground">{profile.bio}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PairingHistoryCard
        pairings={pairingsQuery.data?.results}
        counterpart="student"
        isLoading={pairingsQuery.isPending}
        isError={pairingsQuery.isError}
      />
    </div>
  );
}
