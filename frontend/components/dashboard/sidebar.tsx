"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, Link2, BookOpen, FileText, ClipboardCheck,
  MessageSquare, Bot, Library, LogOut, Settings, GraduationCap, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    { label: "Quizzes", href: "/teacher/quizzes", icon: ClipboardCheck },
    { label: "Chat", href: "/teacher/chat", icon: MessageSquare },
    { label: "AI Tools", href: "/teacher/ai-tools", icon: Brain },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "My Lessons", href: "/student/lessons", icon: BookOpen },
    { label: "Resources", href: "/student/resources", icon: FileText },
    { label: "Library", href: "/student/library", icon: Library },
    { label: "Quizzes", href: "/student/quizzes", icon: ClipboardCheck },
    { label: "Chat", href: "/student/chat", icon: MessageSquare },
    { label: "AI Chatbot", href: "/student/ai-chatbot", icon: Bot },
  ],
};

// Deep, rich sidebar colors per role
const ROLE_THEME: Record<UserRole, { bg: string; logoBg: string; logoText: string }> = {
  admin: {
    bg: "#0c2340",       // deep navy
    logoBg: "rgba(255,255,255,0.12)",
    logoText: "#ffffff",
  },
  teacher: {
    bg: "#7c1d2e",       // burgundy-maroon
    logoBg: "rgba(255,255,255,0.12)",
    logoText: "#ffffff",
  },
  student: {
    bg: "#2e1065",       // deep indigo-violet
    logoBg: "rgba(255,255,255,0.12)",
    logoText: "#ffffff",
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role as UserRole;
  const items = role ? NAV_ITEMS[role] : [];
  const theme = role ? ROLE_THEME[role] : null;

  return (
    <div
      className="flex flex-col h-full w-64"
      style={theme ? { backgroundColor: theme.bg } : undefined}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-6 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div
          className="flex items-center justify-center rounded-lg p-1.5"
          style={{ backgroundColor: theme?.logoBg }}
        >
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-none text-white">Inspired Minds</p>
          <p className="text-xs capitalize mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            {role} Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-0.5 px-3">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/65 hover:bg-white/10 hover:text-white/90"
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
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            pathname === "/profile"
              ? "bg-white/20 text-white"
              : "text-white/65 hover:bg-white/10 hover:text-white/90"
          )}
        >
          <Settings className="h-4 w-4" />
          Profile & Settings
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mt-0.5 text-white/65 hover:text-white/90 hover:bg-white/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
