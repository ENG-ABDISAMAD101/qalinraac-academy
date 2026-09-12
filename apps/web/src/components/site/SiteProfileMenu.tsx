"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mediaPublicUrl } from "@/lib/api";
import { portalPathForRole, useAuth } from "@/lib/auth-context";

function profilePathForRole(role: string) {
  if (role === "Instructor") return "/instructor/profile";
  if (role === "Academic") return "/academic/profile";
  if (role === "Admin") return "/admin/profile";
  if (role === "Super Admin" || role === "SuperAdmin") {
    return "/super-admin/profile";
  }
  if (role === "Finance") return "/finance/profile";
  if (role === "Research" || role === "Researcher") return "/research/profile";
  return "/student/profile";
}

function notificationsPathForRole(role: string) {
  if (role === "Instructor") return "/instructor/notifications";
  if (role === "Academic") return "/academic/notifications";
  if (role === "Admin") return "/admin/notifications";
  if (role === "Super Admin" || role === "SuperAdmin") {
    return "/super-admin/notifications";
  }
  if (role === "Finance") return "/finance/notifications";
  if (role === "Research" || role === "Researcher") {
    return "/research/notifications";
  }
  return "/student/notifications";
}

export function SiteProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const name = user.fullName ?? "User";
  const email = user.email ?? "—";
  const avatarSrc = mediaPublicUrl(user.avatarUrl);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dashboardHref = portalPathForRole(user.role);
  const profileHref = profilePathForRole(user.role);
  const notificationsHref = notificationsPathForRole(user.role);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open profile menu"
        >
          <Avatar className="h-9 w-9 border border-border shadow-sm">
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarSrc} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardHref}>
            <LayoutDashboard />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={profileHref}>
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={notificationsHref}>
            <Bell />
            Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout();
            router.push("/auth/login");
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
