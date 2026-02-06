"use client";

import { RequerimientoStatus, STATUS_CONFIG } from "@/types";
import { cn } from "@/lib/utils";
import {
  FileEdit,
  Shield,
  Briefcase,
  Warehouse,
  ShoppingCart,
  PackageCheck,
  Truck,
  CircleCheckBig,
  XCircle,
} from "lucide-react";

const WORKFLOW_STEPS = [
  {
    key: "BORRADOR",
    label: "Borrador",
    icon: FileEdit,
    states: ["BORRADOR"] as RequerimientoStatus[],
    rejectedState: null,
    // slate
    iconColor: "text-slate-600 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-400 dark:border-slate-500",
    textColor: "text-slate-700 dark:text-slate-300",
  },
  {
    key: "SEGURIDAD",
    label: "Seguridad",
    icon: Shield,
    states: ["VALIDACION_SEGURIDAD", "APROBADO_SEGURIDAD"] as RequerimientoStatus[],
    rejectedState: "RECHAZADO_SEGURIDAD" as RequerimientoStatus,
    // amber
    iconColor: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-400 dark:border-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  {
    key: "GERENCIA",
    label: "Gerencia",
    icon: Briefcase,
    states: ["VALIDACION_GERENCIA", "APROBADO_GERENCIA"] as RequerimientoStatus[],
    rejectedState: "RECHAZADO_GERENCIA" as RequerimientoStatus,
    // orange
    iconColor: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-400 dark:border-orange-500",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  {
    key: "LOGISTICA",
    label: "Logistica",
    icon: Warehouse,
    states: ["REVISION_LOGISTICA"] as RequerimientoStatus[],
    rejectedState: null,
    // blue
    iconColor: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-400 dark:border-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  {
    key: "COMPRAS",
    label: "Compras",
    icon: ShoppingCart,
    states: ["EN_COMPRA", "APROBADO_ADM"] as RequerimientoStatus[],
    rejectedState: "RECHAZADO_ADM" as RequerimientoStatus,
    // purple
    iconColor: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-400 dark:border-purple-500",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  {
    key: "DESPACHO",
    label: "Despacho",
    icon: PackageCheck,
    states: ["LISTO_DESPACHO"] as RequerimientoStatus[],
    rejectedState: null,
    // cyan
    iconColor: "text-cyan-700 dark:text-cyan-300",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    borderColor: "border-cyan-400 dark:border-cyan-500",
    textColor: "text-cyan-700 dark:text-cyan-300",
  },
  {
    key: "ENVIO",
    label: "Envio",
    icon: Truck,
    states: ["ENVIADO"] as RequerimientoStatus[],
    rejectedState: null,
    // indigo
    iconColor: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    borderColor: "border-indigo-400 dark:border-indigo-500",
    textColor: "text-indigo-700 dark:text-indigo-300",
  },
  {
    key: "ENTREGA",
    label: "Entrega",
    icon: CircleCheckBig,
    states: ["ENTREGADO_PARCIAL", "ENTREGADO"] as RequerimientoStatus[],
    rejectedState: null,
    // emerald
    iconColor: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    borderColor: "border-emerald-400 dark:border-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
  },
];

const ALL_STATES_ORDER: RequerimientoStatus[] = [
  "BORRADOR",
  "VALIDACION_SEGURIDAD",
  "APROBADO_SEGURIDAD",
  "VALIDACION_GERENCIA",
  "APROBADO_GERENCIA",
  "REVISION_LOGISTICA",
  "EN_COMPRA",
  "APROBADO_ADM",
  "LISTO_DESPACHO",
  "ENVIADO",
  "ENTREGADO_PARCIAL",
  "ENTREGADO",
];

type StepStatus = "completed" | "active" | "pending" | "rejected";

function getStepStatus(
  step: (typeof WORKFLOW_STEPS)[number],
  currentEstado: RequerimientoStatus
): StepStatus {
  if (step.rejectedState && currentEstado === step.rejectedState) {
    return "rejected";
  }
  if (step.states.includes(currentEstado)) {
    return "active";
  }

  const isRejected = WORKFLOW_STEPS.some((s) => s.rejectedState === currentEstado);
  if (isRejected) {
    const rejectedStepIdx = WORKFLOW_STEPS.findIndex((s) => s.rejectedState === currentEstado);
    const thisStepIdx = WORKFLOW_STEPS.findIndex((s) => s.key === step.key);
    if (thisStepIdx < rejectedStepIdx) return "completed";
    return "pending";
  }

  const currentIdx = ALL_STATES_ORDER.indexOf(currentEstado);
  if (currentIdx === -1) return "pending";

  const stepMaxIdx = Math.max(...step.states.map((s) => ALL_STATES_ORDER.indexOf(s)));
  const stepMinIdx = Math.min(...step.states.map((s) => ALL_STATES_ORDER.indexOf(s)));

  if (currentIdx > stepMaxIdx) return "completed";
  if (currentIdx >= stepMinIdx && currentIdx <= stepMaxIdx) return "active";
  return "pending";
}

interface RequerimientoStepperProps {
  estado: RequerimientoStatus;
}

export function RequerimientoStepper({ estado }: RequerimientoStepperProps) {
  const stepStatuses = WORKFLOW_STEPS.map((step) => getStepStatus(step, estado));

  return (
    <div className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Connector line behind circles — from center of first to center of last */}
          <div
            className="absolute h-0.5 bg-border"
            style={{ top: 20, left: `calc(100% / ${WORKFLOW_STEPS.length} / 2)`, right: `calc(100% / ${WORKFLOW_STEPS.length} / 2)` }}
          />

          {/* Steps grid */}
          <div
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${WORKFLOW_STEPS.length}, 1fr)` }}
          >
            {WORKFLOW_STEPS.map((step, idx) => {
              const status = stepStatuses[idx];
              const Icon = status === "rejected" ? XCircle : step.icon;
              const isReachedOrActive = status === "completed" || status === "active";

              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5">
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isReachedOrActive && `${step.bgColor} ${step.borderColor}`,
                      status === "active" && "ring-4 ring-primary/20",
                      status === "pending" && "bg-muted border-border text-muted-foreground",
                      status === "rejected" && "bg-red-100 border-red-400 dark:bg-red-950/30 dark:border-red-500"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isReachedOrActive && step.iconColor,
                        status === "pending" && "text-muted-foreground",
                        status === "rejected" && "text-red-600 dark:text-red-400"
                      )}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-[11px] font-medium text-center leading-tight",
                      isReachedOrActive && step.textColor,
                      status === "active" && "font-semibold",
                      status === "pending" && "text-muted-foreground",
                      status === "rejected" && "text-red-600 dark:text-red-400 font-semibold"
                    )}
                  >
                    {step.label}
                  </span>

                  {status === "active" && (
                    <span className="text-[10px] text-muted-foreground text-center leading-tight -mt-1">
                      {STATUS_CONFIG[estado]?.label || estado}
                    </span>
                  )}
                  {status === "rejected" && (
                    <span className="text-[10px] text-red-500 text-center leading-tight -mt-1">
                      Rechazado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="flex flex-col gap-0 md:hidden">
        {WORKFLOW_STEPS.map((step, idx) => {
          const status = getStepStatus(step, estado);
          const Icon = status === "rejected" ? XCircle : step.icon;
          const isReachedOrActive = status === "completed" || status === "active";

          return (
            <div key={step.key} className="flex items-start gap-3 relative">
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[19px] top-10 h-full w-0.5",
                    isReachedOrActive ? "bg-primary/30" : "bg-border"
                  )}
                />
              )}

              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 z-10",
                  isReachedOrActive && `${step.bgColor} ${step.borderColor}`,
                  status === "active" && "ring-4 ring-primary/20",
                  status === "pending" && "bg-muted border-border text-muted-foreground",
                  status === "rejected" && "bg-red-100 border-red-400 dark:bg-red-950/30 dark:border-red-500"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isReachedOrActive && step.iconColor,
                    status === "pending" && "text-muted-foreground",
                    status === "rejected" && "text-red-600 dark:text-red-400"
                  )}
                />
              </div>

              <div className="pb-6 pt-2 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    isReachedOrActive && step.textColor,
                    status === "active" && "font-semibold",
                    status === "pending" && "text-muted-foreground",
                    status === "rejected" && "text-red-600 dark:text-red-400"
                  )}
                >
                  {step.label}
                </p>
                {status === "active" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {STATUS_CONFIG[estado]?.label || estado}
                  </p>
                )}
                {status === "rejected" && (
                  <p className="text-xs text-red-500 mt-0.5">Rechazado</p>
                )}
                {status === "completed" && (
                  <p className={cn("text-xs mt-0.5", step.textColor, "opacity-60")}>
                    Completado
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
