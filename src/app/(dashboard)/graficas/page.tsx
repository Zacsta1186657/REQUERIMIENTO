"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Box,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  Percent,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

interface GraficasData {
  kpis: {
    totalRequerimientos: number;
    totalItems: number;
    totalLotes: number;
    tasaAprobacion: number;
  };
  requerimientosPorGrupo: Array<{ name: string; value: number; color: string }>;
  itemsClasificacion: Array<{ name: string; value: number }>;
  aprobacionesEtapa: Array<{ etapa: string; aprobados: number; rechazados: number }>;
  lotesPorEstado: Array<{ name: string; value: number }>;
  requerimientosPorMes: Array<{ name: string; value: number }>;
  tiemposPromedio: Array<{ label: string; dias: number | null }>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      {label && <p className="text-sm font-medium mb-1">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-9 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function GraficasPage() {
  const [data, setData] = useState<GraficasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/graficas");
        if (!response.ok) throw new Error("Error al cargar los datos");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">{error || "No se pudieron cargar los datos"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiItems = [
    {
      title: "Total Requerimientos",
      value: data.kpis.totalRequerimientos,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      borderColor: "border-l-blue-500",
    },
    {
      title: "Total Items",
      value: data.kpis.totalItems,
      icon: Box,
      color: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      borderColor: "border-l-purple-500",
    },
    {
      title: "Total Lotes",
      value: data.kpis.totalLotes,
      icon: Package,
      color: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      borderColor: "border-l-amber-500",
    },
    {
      title: "Tasa Aprobación",
      value: `${data.kpis.tasaAprobacion}%`,
      icon: Percent,
      color: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      borderColor: "border-l-green-500",
    },
  ];

  const ITEMS_COLORS = ['#3b82f6', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Graficas
        </h1>
        <p className="text-muted-foreground text-sm">
          Resumen visual del estado de los requerimientos
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {kpiItems.map((kpi) => (
          <Card
            key={kpi.title}
            className={`border-l-4 ${kpi.borderColor} hover:shadow-md transition-all duration-200 group`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Pie + Items Bar */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Pie: Requerimientos por estado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Requerimientos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.requerimientosPorGrupo}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name} (${value})` : ''}
                >
                  {data.requerimientosPorGrupo.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar: Items clasificacion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clasificacion de Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.itemsClasificacion}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                  {data.itemsClasificacion.map((_, index) => (
                    <Cell key={index} fill={ITEMS_COLORS[index % ITEMS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Aprobaciones + Lotes */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Bar agrupado: Aprobaciones por etapa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aprobaciones vs Rechazos por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.aprobacionesEtapa}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="aprobados" name="Aprobados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rechazados" name="Rechazados" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar: Lotes por estado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lotes por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.lotesPorEstado}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Lotes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Tendencia mensual + Tiempos promedio */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Line: Requerimientos por mes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.requerimientosPorMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Requerimientos"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cards: Tiempos promedio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempos Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {data.tiemposPromedio.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{t.label}</p>
                    <p className="text-lg font-bold">
                      {t.dias !== null ? `${t.dias} dias` : 'Sin datos'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer note */}
      <div className="flex items-center justify-center">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Datos actualizados en tiempo real
        </p>
      </div>
    </div>
  );
}
