"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  FileText,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  total: number;
  pendientes: number;
  enTransito: number;
  entregadosMes: number;
  cambioMes: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/requerimientos/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statItems = [
    {
      title: "Total Requerimientos",
      value: stats?.total ?? 0,
      icon: FileText,
      description: "Requerimientos registrados",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      borderColor: "border-l-blue-500",
    },
    {
      title: "Pendientes de Aprobación",
      value: stats?.pendientes ?? 0,
      icon: Clock,
      description: "Esperando validación",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      borderColor: "border-l-amber-500",
    },
    {
      title: "En Tránsito",
      value: stats?.enTransito ?? 0,
      icon: Truck,
      description: "En camino a destino",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      borderColor: "border-l-purple-500",
    },
    {
      title: "Completados",
      value: stats?.entregadosMes ?? 0,
      icon: CheckCircle2,
      description: "Entregados este mes",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/40",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      borderColor: "border-l-green-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-9 w-14" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <Card
          key={stat.title}
          className={`border-l-4 ${stat.borderColor} hover:shadow-md transition-all duration-200 group`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
