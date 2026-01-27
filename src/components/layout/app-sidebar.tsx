"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABELS, UserRole } from "@/types";
import {
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Roles that can manage users
const ADMIN_ROLES: UserRole[] = ["ADMIN", "ADMINISTRACION"];

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    adminOnly: false,
    excludeRoles: [] as UserRole[],
  },
  {
    title: "Requerimientos",
    url: "/requerimientos",
    icon: ClipboardList,
    adminOnly: false,
    excludeRoles: [] as UserRole[],
  },
  {
    title: "Aprobaciones",
    url: "/aprobaciones",
    icon: CheckSquare,
    adminOnly: false,
    excludeRoles: ["TECNICO"] as UserRole[],
  },
  {
    title: "Usuarios",
    url: "/usuarios",
    icon: Users,
    adminOnly: true,
    excludeRoles: [] as UserRole[],
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
    adminOnly: false,
    excludeRoles: [] as UserRole[],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isAdmin = user && ADMIN_ROLES.includes(user.rol);

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
  };

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    // Check if user role is excluded from this menu item
    if (user && item.excludeRoles.includes(user.rol)) {
      return false;
    }
    // Check admin-only items
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  const userInitials = user?.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Gestión Almacén</span>
            <span className="text-xs text-sidebar-foreground/70">
              Sistema de Requerimientos
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {isLoading ? (
          <div className="flex items-center gap-3 px-2 py-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium">
              {userInitials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">
                {user.nombre}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {ROLE_LABELS[user.rol]}
              </span>
            </div>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
