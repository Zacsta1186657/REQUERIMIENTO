"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timeline, TimelineEvent } from "@/components/requerimientos/timeline";
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

interface Requerimiento {
  id: string;
  numero: string;
  motivo: string;
  estado: string;
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
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>("all");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Fetch activity and requerimientos on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [activityRes, reqRes] = await Promise.all([
          fetch("/api/dashboard/activity?limit=10"),
          fetch("/api/requerimientos?limit=100"),
        ]);

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivity(activityData.data || []);
        }

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequerimientos(reqData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch timeline when a requerimiento is selected
  useEffect(() => {
    if (!selectedReqId || selectedReqId === "all") {
      setTimeline([]);
      return;
    }

    async function fetchTimeline() {
      setIsLoadingTimeline(true);
      try {
        const response = await fetch(`/api/requerimientos/${selectedReqId}/timeline`);
        if (response.ok) {
          const data = await response.json();
          setTimeline(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching timeline:", error);
      } finally {
        setIsLoadingTimeline(false);
      }
    }

    fetchTimeline();
  }, [selectedReqId]);

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
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          <Select value={selectedReqId} onValueChange={setSelectedReqId}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Seleccionar requerimiento para ver flujo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="text-muted-foreground">Ver actividad general</span>
              </SelectItem>
              {requerimientos.map((req) => (
                <SelectItem key={req.id} value={req.id}>
                  {req.numero} - {req.motivo.slice(0, 30)}{req.motivo.length > 30 ? "..." : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {selectedReqId && selectedReqId !== "all" ? (
            // Mostrar timeline del requerimiento seleccionado
            isLoadingTimeline ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay historial para este requerimiento
              </p>
            ) : (
              <Timeline events={timeline} />
            )
          ) : (
            // Mostrar actividad reciente general
            activity.length === 0 ? (
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
            )
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
