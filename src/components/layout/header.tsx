"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Bell,
  Search,
  Loader2,
  FilePlus,
  Clock,
  RefreshCw,
  XCircle,
  Package,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
  requerimiento?: {
    id: string;
    numero: string;
  } | null;
}

const NOTIFICATION_STYLE: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  REQUERIMIENTO_CREADO: { icon: FilePlus, bg: "bg-blue-100 dark:bg-blue-900/50", color: "text-blue-600 dark:text-blue-400" },
  APROBACION_PENDIENTE: { icon: Clock, bg: "bg-amber-100 dark:bg-amber-900/50", color: "text-amber-600 dark:text-amber-400" },
  ESTADO_CAMBIO: { icon: RefreshCw, bg: "bg-purple-100 dark:bg-purple-900/50", color: "text-purple-600 dark:text-purple-400" },
  RECHAZADO: { icon: XCircle, bg: "bg-red-100 dark:bg-red-900/50", color: "text-red-600 dark:text-red-400" },
  LISTO_DESPACHO: { icon: Package, bg: "bg-cyan-100 dark:bg-cyan-900/50", color: "text-cyan-600 dark:text-cyan-400" },
  ENTREGADO: { icon: CheckCircle2, bg: "bg-green-100 dark:bg-green-900/50", color: "text-green-600 dark:text-green-400" },
};

const getNotificationStyle = (tipo: string) => {
  return NOTIFICATION_STYLE[tipo] || { icon: Bell, bg: "bg-gray-100 dark:bg-gray-800", color: "text-gray-600 dark:text-gray-400" };
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
};

export function Header() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fix hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notificaciones?limit=5");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notificaciones/${id}/read`, { method: "POST" });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notificaciones/all/read", { method: "POST" });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />

        {/* Search - Hidden on mobile */}
        <div className="hidden md:flex md:flex-1 md:items-center md:gap-4">
          <form
            className="flex-1 max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              if (q) {
                router.push(`/requerimientos?search=${encodeURIComponent(q)}`);
                setSearchQuery("");
              }
            }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por N° req, motivo o solicitante..."
                className="pl-8 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search button */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
            <Search className="h-4 w-4" />
            <span className="sr-only">Buscar</span>
          </Button>

          {/* Notifications */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notificaciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[390px] p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">Notificaciones</h4>
                    {unreadCount > 0 && (
                      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator className="m-0" />

                {/* Content */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                    {notifications.map((notification, idx) => {
                      const style = getNotificationStyle(notification.tipo);
                      const Icon = style.icon;
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className="p-0 rounded-none focus:bg-muted/50"
                          asChild
                        >
                          <Link
                            href={
                              notification.requerimiento
                                ? `/requerimientos/${notification.requerimiento.id}`
                                : "#"
                            }
                            onClick={() => handleMarkAsRead(notification.id)}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                              !notification.leida ? "bg-muted/30" : ""
                            } ${idx < notifications.length - 1 ? "border-b border-border/50" : ""}`}
                          >
                            {/* Icon */}
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                              <Icon className={`h-[18px] w-[18px] ${style.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] leading-snug truncate ${!notification.leida ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                                {notification.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {notification.mensaje}
                              </p>
                              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>

                            {/* Unread dot */}
                            {!notification.leida && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem asChild className="justify-center rounded-none py-2.5 focus:bg-muted/50">
                  <Link
                    href="/notificaciones"
                    className="text-[13px] font-medium text-primary hover:text-primary/80"
                  >
                    Ver todas las notificaciones
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notificaciones</span>
            </Button>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User navigation */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
