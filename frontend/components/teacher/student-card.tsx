import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Pairing } from "@/lib/api/pairings";

interface StudentCardProps {
  pairing: Pairing;
}

export function StudentCard({ pairing }: StudentCardProps) {
  const router = useRouter();
  const { student } = pairing;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={student.avatar ?? undefined} alt={student.first_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(student.first_name, student.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {student.first_name} {student.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
            <Badge variant="outline" className="mt-1.5 text-xs">
              {pairing.subject}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-4 text-xs gap-1.5"
          onClick={() => router.push("/teacher/chat")}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </Button>
      </CardContent>
    </Card>
  );
}
