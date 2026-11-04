"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserCheck, Link2, BookOpen, FileText,
  MessageSquare, Library, LogOut, Settings, GraduationCap, Bot, Sparkles, ShieldCheck,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: Record<UserRole, NavGroup[]> = {
  admin: [
    { items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
    {
      label: "People",
      items: [
        { label: "Teachers", href: "/admin/teachers", icon: UserCheck },
        { label: "Students", href: "/admin/students", icon: Users },
        { label: "Pairings", href: "/admin/pairings", icon: Link2 },
      ],
    },
    {
      label: "Content & safety",
      items: [
        { label: "Library", href: "/admin/library", icon: Library },
        { label: "Tutor Chats", href: "/admin/tutor-chats", icon: ShieldCheck },
      ],
    },
  ],
  teacher: [
    { items: [{ label: "Dashboard", href: "/teacher", icon: LayoutDashboard }] },
    {
      label: "Teaching",
      items: [
        { label: "My Students", href: "/teacher/students", icon: GraduationCap },
        { label: "Lessons", href: "/teacher/lessons", icon: BookOpen },
        { label: "Resources", href: "/teacher/resources", icon: FileText },
        { label: "Chat", href: "/teacher/chat", icon: MessageSquare },
      ],
    },
    {
      label: "AI",
      items: [
        { label: "AI Tools", href: "/teacher/ai-tools", icon: Sparkles },
        { label: "Tutor Chats", href: "/teacher/tutor-chats", icon: ShieldCheck },
      ],
    },
  ],
  student: [
    { items: [{ label: "Dashboard", href: "/student", icon: LayoutDashboard }] },
    {
      label: "Learning",
      items: [
        { label: "My Lessons", href: "/student/lessons", icon: BookOpen },
        { label: "Resources", href: "/student/resources", icon: FileText },
        { label: "Library", href: "/student/library", icon: Library },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Chat with Teacher", href: "/student/chat", icon: MessageSquare },
        { label: "AI Tutor", href: "/student/tutor", icon: Bot },
      ],
    },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

function isActive(pathname: string, href: string) {
  // Role home pages ("/admin") only match exactly; everything else matches its sub-pages too.
  return href.split("/").length === 2 ? pathname === href : pathname.startsWith(href);
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-white"
          : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gold" aria-hidden />}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-gold" : "text-sidebar-muted group-hover:text-sidebar-foreground")} />
      {item.label}
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role as UserRole | undefined;
  const groups = role ? NAV_GROUPS[role] : [];

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <Link href={role ? `/${role}` : "/"} onClick={onNavigate} className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
          <Image src="/logo-mark.png" alt="" width={32} height={32} className="h-8 w-8" priority />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-white">
            Inspired <span className="text-gold">Minds</span>
          </span>
          <span className="block text-xs text-sidebar-muted">{role ? `${ROLE_LABEL[role]} portal` : "Learning portal"}</span>
        </span>
      </Link>

      <ScrollArea className="flex-1">
        <nav className="space-y-6 px-3 py-3" aria-label="Main">
          {groups.map((group, i) => (
            <div key={group.label ?? i} className="space-y-1">
              {group.label && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/80">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        <NavLink
          item={{ label: "Profile & Settings", href: "/profile", icon: Settings }}
          active={pathname === "/profile"}
          onNavigate={onNavigate}
        />
        {user && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8 ring-2 ring-white/10">
              <AvatarImage src={user.avatar ?? undefined} alt="" />
              <AvatarFallback className="bg-gold text-gold-foreground text-xs font-semibold">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.first_name} {user.last_name}</p>
              <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
