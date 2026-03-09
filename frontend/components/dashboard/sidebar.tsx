"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, Link2, BookOpen, FileText,
  MessageSquare, Bot, Library, LogOut, Settings, GraduationCap, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Teachers", href: "/admin/teachers", icon: UserCheck },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Pairings", href: "/admin/pairings", icon: Link2 },
    { label: "Library", href: "/admin/library", icon: Library },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "My Students", href: "/teacher/students", icon: GraduationCap },
    { label: "Lessons", href: "/teacher/lessons", icon: BookOpen },
    { label: "Resources", href: "/teacher/resources", icon: FileText },
    { label: "Chat", href: "/teacher/chat", icon: MessageSquare },
    { label: "AI Tools", href: "/teacher/ai-tools", icon: Brain },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "My Lessons", href: "/student/lessons", icon: BookOpen },
    { label: "Resources", href: "/student/resources", icon: FileText },
    { label: "Library", href: "/student/library", icon: Library },
    { label: "Chat", href: "/student/chat", icon: MessageSquare },
    { label: "AI Chatbot", href: "/student/ai-chatbot", icon: Bot },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role as UserRole;
  const items = role ? NAV_ITEMS[role] : [];

  return (
    <div className="flex flex-col h-full border-r bg-background w-64">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-lg p-1.5">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-none">Inspired Minds</p>
          <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin" || item.href === "/teacher" || item.href === "/student"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t space-y-1">
        <Separator className="mb-2" />
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Profile & Settings
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
