"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getInitials, formatDate } from "@/lib/utils";
import { usersApi } from "@/lib/api/users";
import { pairingsApi } from "@/lib/api/pairings";
import type { User } from "@/lib/api/users";
import type { Pairing } from "@/lib/api/pairings";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<User | null>(null);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.getStudent(id),
      pairingsApi.getAll({ student: id }),
    ])
      .then(([user, pairingData]) => {
        setStudent(user);
        setPairings(pairingData.results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-16 text-muted-foreground">Student not found.</div>;
  }

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
                  <p className="font-medium capitalize">{profile.education_level.replace("_", " ")}</p>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pairings ({pairings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pairings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pairings yet.</p>
          ) : (
            <div className="space-y-2">
              {pairings.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
                >
                  <div>
                    <span className="font-medium">{p.teacher.first_name} {p.teacher.last_name}</span>
                    <span className="text-muted-foreground ml-2">· {p.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(p.start_date)}</span>
                    <Badge
                      className={
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs"
                          : p.status === "paused"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs"
                          : "text-xs"
                      }
                      variant={p.status === "ended" ? "secondary" : "default"}
                    >
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
