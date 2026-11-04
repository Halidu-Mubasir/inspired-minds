"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-8">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <Link href={user ? `/${user.role}` : "/"} className="flex items-center gap-2 md:hidden">
        <Image src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7" />
        <span className="text-sm font-bold tracking-tight text-primary">
          Inspired <span className="text-leaf">Minds</span>
        </span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        {user && user.role !== "admin" && <NotificationBell userId={user.id} role={user.role} />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 rounded-full pl-1 pr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar ?? undefined} alt="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {user ? getInitials(user.first_name, user.last_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user?.first_name}</span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile"><Settings className="h-4 w-4" />Profile & Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
              <LogOut className="h-4 w-4" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
