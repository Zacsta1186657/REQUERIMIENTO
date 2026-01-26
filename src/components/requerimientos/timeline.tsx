"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG, ROLE_LABELS, RequerimientoStatus, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Send, Package, Truck, ArrowRight } from "lucide-react";

export interface TimelineEvent {
  id: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  comentario: string | null;
  fecha: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
  };
}

interface TimelineProps {
  events: TimelineEvent[];
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get action description based on state transition
const getActionDescription = (estadoAnterior: string | null, estadoNuevo: string, rol: string): { text: string; icon: React.ReactNode; color: string } => {
  const rolLabel = ROLE_LABELS[rol as UserRole] || rol;

  // Submission
  if (estadoAnterior === "BORRADOR" && estadoNuevo === "VALIDACION_SEGURIDAD") {
    return { text: "Envió el requerimiento", icon: <Send className="h-3 w-3" />, color: "text-blue-600" };
  }

  // Security approval
  if (estadoAnterior === "VALIDACION_SEGURIDAD" && estadoNuevo === "VALIDACION_GERENCIA") {
    return { text: `Aprobado por ${rolLabel}`, icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600" };
  }

  // Security rejection
  if (estadoAnterior === "VALIDACION_SEGURIDAD" && estadoNuevo === "RECHAZADO_SEGURIDAD") {
    return { text: `Rechazado por ${rolLabel}`, icon: <XCircle className="h-3 w-3" />, color: "text-red-600" };
  }

  // Management approval
  if (estadoAnterior === "VALIDACION_GERENCIA" && estadoNuevo === "REVISION_LOGISTICA") {
    return { text: `Aprobado por ${rolLabel}`, icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600" };
  }

  // Management rejection
  if (estadoAnterior === "VALIDACION_GERENCIA" && estadoNuevo === "RECHAZADO_GERENCIA") {
    return { text: `Rechazado por ${rolLabel}`, icon: <XCircle className="h-3 w-3" />, color: "text-red-600" };
  }

  // Logistics processing
  if (estadoAnterior === "REVISION_LOGISTICA") {
    if (estadoNuevo === "EN_COMPRA") {
      return { text: "Enviado a compras", icon: <Package className="h-3 w-3" />, color: "text-orange-600" };
    }
    if (estadoNuevo === "LISTO_DESPACHO") {
      return { text: "Marcado listo para despacho", icon: <Truck className="h-3 w-3" />, color: "text-cyan-600" };
    }
  }

  // Admin approval
  if (estadoAnterior === "EN_COMPRA" && estadoNuevo === "LISTO_DESPACHO") {
    return { text: `Compra aprobada por ${rolLabel}`, icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600" };
  }

  // Admin rejection
  if (estadoAnterior === "EN_COMPRA" && estadoNuevo === "RECHAZADO_ADM") {
    return { text: `Compra rechazada por ${rolLabel}`, icon: <XCircle className="h-3 w-3" />, color: "text-red-600" };
  }

  // Dispatch
  if (estadoNuevo === "ENVIADO") {
    return { text: "Despachado", icon: <Truck className="h-3 w-3" />, color: "text-indigo-600" };
  }

  // Delivery
  if (estadoNuevo === "ENTREGADO_PARCIAL") {
    return { text: "Entrega parcial confirmada", icon: <Package className="h-3 w-3" />, color: "text-teal-600" };
  }
  if (estadoNuevo === "ENTREGADO") {
    return { text: "Entrega completa confirmada", icon: <CheckCircle className="h-3 w-3" />, color: "text-green-600" };
  }

  // Default
  return { text: "Cambio de estado", icon: <ArrowRight className="h-3 w-3" />, color: "text-gray-600" };
};

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay historial disponible
      </p>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => {
        const estadoNuevo = event.estadoNuevo as RequerimientoStatus;
        const estadoAnterior = event.estadoAnterior as RequerimientoStatus | null;
        const configNuevo = STATUS_CONFIG[estadoNuevo] || {
          label: estadoNuevo,
          color: "text-gray-700",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-300",
        };
        const configAnterior = estadoAnterior ? STATUS_CONFIG[estadoAnterior] : null;

        const action = getActionDescription(event.estadoAnterior, event.estadoNuevo, event.usuario.rol);

        const initials = event.usuario.nombre
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Line connector */}
            {index < sortedEvents.length - 1 && (
              <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-border" />
            )}

            {/* Status indicator */}
            <div
              className={cn(
                "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                configNuevo.bgColor,
                configNuevo.borderColor
              )}
            >
              <div
                className={cn("h-2.5 w-2.5 rounded-full", {
                  "bg-slate-500": estadoNuevo === "BORRADOR",
                  "bg-gray-500": estadoNuevo === "CREADO",
                  "bg-amber-500": estadoNuevo.includes("VALIDACION"),
                  "bg-green-500": estadoNuevo.includes("APROBADO") || estadoNuevo === "ENTREGADO",
                  "bg-red-500": estadoNuevo.includes("RECHAZADO"),
                  "bg-blue-500": estadoNuevo === "REVISION_LOGISTICA",
                  "bg-purple-500": estadoNuevo === "EN_COMPRA",
                  "bg-cyan-500": estadoNuevo === "LISTO_DESPACHO",
                  "bg-indigo-500": estadoNuevo === "ENVIADO",
                  "bg-teal-500": estadoNuevo === "ENTREGADO_PARCIAL",
                })}
              />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              {/* Action description with icon */}
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("flex items-center gap-1 text-sm font-medium", action.color)}>
                  {action.icon}
                  {action.text}
                </span>
              </div>

              {/* State transition */}
              <div className="flex items-center gap-2 text-xs">
                {configAnterior && (
                  <>
                    <Badge variant="outline" className={cn("text-xs py-0", configAnterior.color)}>
                      {configAnterior.label}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <Badge variant="outline" className={cn("text-xs py-0", configNuevo.color)}>
                  {configNuevo.label}
                </Badge>
              </div>

              {event.comentario && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  &ldquo;{event.comentario}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {event.usuario.nombre}
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1">
                    {ROLE_LABELS[event.usuario.rol as UserRole] || event.usuario.rol}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(event.fecha)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
