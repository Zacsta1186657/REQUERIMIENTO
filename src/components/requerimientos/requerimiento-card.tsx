"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { RequerimientoListItem } from "@/stores/requerimientos-store";
import { Calendar, Eye, Package, User } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "./status-badge";

interface RequerimientoCardProps {
  requerimiento: RequerimientoListItem;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function RequerimientoCard({ requerimiento }: RequerimientoCardProps) {
  const initials = requerimiento.solicitante.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/requerimientos/${requerimiento.id}`}
              className="font-semibold text-lg hover:text-primary transition-colors"
            >
              {requerimiento.numero}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {requerimiento.motivo}
            </p>
          </div>
          <StatusBadge status={requerimiento.estado} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span>{requerimiento.solicitante.nombre}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(requerimiento.fecha)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{requerimiento._count?.items || 0} items</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Operación:</span> {requerimiento.operacion.nombre}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href={`/requerimientos/${requerimiento.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalle
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
