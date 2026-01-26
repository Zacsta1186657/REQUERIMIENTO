"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, FileText, Loader2, Package, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario: string;
  requerimientoId: string;
  requerimientoNumero: string;
  estadoNuevo: string;
  comentario: string | null;
}

const getActivityIcon = (tipo: string) => {
  switch (tipo) {
    case "creado":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "aprobado":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "rechazado":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pendiente":
      return <Loader2 className="h-4 w-4 text-amber-500" />;
    case "entregado":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "enviado":
      return <Truck className="h-4 w-4 text-indigo-500" />;
    case "despacho":
      return <Package className="h-4 w-4 text-cyan-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} horas`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
};

export function RecentActivity() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch("/api/dashboard/activity?limit=10");
        if (response.ok) {
          const data = await response.json();
          setActivity(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, []);

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-4 w-4 rounded-full mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividad reciente
            </p>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <Link
                  key={item.id}
                  href={`/requerimientos/${item.requerimientoId}`}
                  className="flex items-start gap-4 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="mt-1">{getActivityIcon(item.tipo)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item.descripcion}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {item.usuario
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{item.usuario}</span>
                      <span>•</span>
                      <span>{formatDate(item.fecha)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
