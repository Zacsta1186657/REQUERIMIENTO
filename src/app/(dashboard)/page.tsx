"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { useAuthStore } from "@/stores/auth-store";
import { Plus } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {firstName}
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <Button asChild>
          <Link href="/requerimientos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Requerimiento
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start h-auto py-4">
              <Link href="/requerimientos/nuevo">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Crear Requerimiento</span>
                  <span className="text-xs text-muted-foreground">
                    Solicita materiales o equipos
                  </span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-4">
              <Link href="/requerimientos">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Ver Mis Requerimientos</span>
                  <span className="text-xs text-muted-foreground">
                    Revisa el estado de tus solicitudes
                  </span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start h-auto py-4">
              <Link href="/aprobaciones">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Bandeja de Aprobaciones</span>
                  <span className="text-xs text-muted-foreground">
                    Requerimientos pendientes de tu acción
                  </span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
