"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { useAuthStore } from "@/stores/auth-store";
import {
  Plus,
  FileText,
  ClipboardList,
  Inbox,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);
  const firstName = user?.nombre?.split(" ")[0] || "Usuario";

  // Solo TECNICO y ADMIN pueden crear requerimientos
  const canCreateRequerimiento = user && (user.rol === 'TECNICO' || user.rol === 'ADMIN');
  const canSeeAprobaciones = user && user.rol !== 'TECNICO';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>
        {canCreateRequerimiento && (
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/requerimientos/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Requerimiento
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity />

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Acciones Rapidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {canCreateRequerimiento && (
              <Link
                href="/requerimientos/nuevo"
                className="group flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 hover:border-primary/20 transition-all duration-200"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Crear Requerimiento</p>
                  <p className="text-xs text-muted-foreground">
                    Solicita materiales o equipos
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
            <Link
              href="/requerimientos"
              className="group flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 group-hover:scale-105 transition-transform">
                <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Ver Mis Requerimientos</p>
                <p className="text-xs text-muted-foreground">
                  Revisa el estado de tus solicitudes
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            {canSeeAprobaciones && (
              <Link
                href="/aprobaciones"
                className="group flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 hover:border-primary/20 transition-all duration-200"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 group-hover:scale-105 transition-transform">
                  <Inbox className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Bandeja de Aprobaciones</p>
                  <p className="text-xs text-muted-foreground">
                    Requerimientos pendientes de tu accion
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
