import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import type { User } from "@/lib/api/users";

interface UserCardProps {
  user: User;
  basePath: string;
  onEdit?: (user: User) => void;
}

export function UserCard({ user, basePath, onEdit }: UserCardProps) {
  const router = useRouter();
  const subjects =
    user.teacher_profile?.subjects ?? user.student_profile?.subjects_of_interest ?? [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={user.avatar ?? undefined} alt={user.first_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">
                {user.first_name} {user.last_name}
              </p>
              <Badge
                variant={user.is_active ? "default" : "secondary"}
                className={
                  user.is_active
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-1.5"
                    : "text-xs px-1.5"
                }
              >
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>

            {user.teacher_profile && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.teacher_profile.years_of_experience} yr
                {user.teacher_profile.years_of_experience !== 1 ? "s" : ""} exp
                {user.teacher_profile.is_available ? " · Available" : " · Unavailable"}
              </p>
            )}
            {user.student_profile && (
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {user.student_profile.education_level.replace("_", " ")}
                {user.student_profile.school_name
                  ? ` · ${user.student_profile.school_name}`
                  : ""}
              </p>
            )}

            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {subjects.slice(0, 3).map((s) => (
                  <Badge key={s} variant="outline" className="text-xs px-1.5 py-0">
                    {s}
                  </Badge>
                ))}
                {subjects.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    +{subjects.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => router.push(`${basePath}/${user.id}`)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs"
            onClick={() => onEdit?.(user)}
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
