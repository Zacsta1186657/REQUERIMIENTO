"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/requerimientos/status-badge";
import { RequerimientoStatus } from "@/types";
import { CheckCircle, Eye, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ApprovalRequerimiento {
  id: string;
  numero: string;
  fecha: string;
  motivo: string;
  estado: RequerimientoStatus;
  solicitante: {
    id: string;
    nombre: string;
    email: string;
  };
  operacion: {
    id: string;
    nombre: string;
  };
  _count: {
    items: number;
  };
}

interface ApprovalSummary {
  VALIDACION_SEGURIDAD?: number;
  VALIDACION_GERENCIA?: number;
  EN_COMPRA?: number;
  REVISION_LOGISTICA?: number;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function ApprovalCard({
  requerimiento,
  onApprove,
  onReject,
  isApproving,
}: {
  requerimiento: ApprovalRequerimiento;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: string | null;
}) {
  const initials = requerimiento.solicitante.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isProcessing = isApproving === requerimiento.id;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/requerimientos/${requerimiento.id}`}
                  className="font-semibold hover:text-primary hover:underline"
                >
                  {requerimiento.numero}
                </Link>
                <StatusBadge status={requerimiento.estado} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {requerimiento.motivo}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{requerimiento.solicitante.nombre}</span>
                <span>{formatDate(requerimiento.fecha)}</span>
                <span>{requerimiento._count?.items || 0} items</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-14 md:ml-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`/requerimientos/${requerimiento.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => onReject(requerimiento.id)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(requerimiento.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Aprobar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AprobacionesPage() {
  const router = useRouter();
  const [requerimientos, setRequerimientos] = useState<ApprovalRequerimiento[]>([]);
  const [summary, setSummary] = useState<ApprovalSummary>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const fetchAprobaciones = async () => {
    try {
      const response = await fetch("/api/aprobaciones");
      if (response.ok) {
        const data = await response.json();
        setRequerimientos(data.data || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error("Error fetching aprobaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAprobaciones();
  }, []);

  const handleApprove = async (id: string) => {
    setIsApproving(id);
    try {
      const response = await fetch(`/api/requerimientos/${id}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        await fetchAprobaciones();
      }
    } catch (error) {
      console.error("Error approving:", error);
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = (id: string) => {
    router.push(`/requerimientos/${id}`);
  };

  const seguridadPending = requerimientos.filter(
    (r) => r.estado === "VALIDACION_SEGURIDAD"
  );
  const gerenciaPending = requerimientos.filter(
    (r) => r.estado === "VALIDACION_GERENCIA"
  );
  const compraPending = requerimientos.filter(
    (r) => r.estado === "EN_COMPRA"
  );
  const logisticaPending = requerimientos.filter(
    (r) => r.estado === "REVISION_LOGISTICA"
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bandeja de Aprobaciones
        </h1>
        <p className="text-muted-foreground">
          Requerimientos pendientes de tu aprobación o revisión
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validación Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summary.VALIDACION_SEGURIDAD || 0}
            </div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validación Gerencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.VALIDACION_GERENCIA || 0}
            </div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revisión Logística
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.REVISION_LOGISTICA || 0}
            </div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprobación Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.EN_COMPRA || 0}
            </div>
            <p className="text-xs text-muted-foreground">pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({requerimientos.length})
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            Seguridad ({seguridadPending.length})
          </TabsTrigger>
          <TabsTrigger value="gerencia">
            Gerencia ({gerenciaPending.length})
          </TabsTrigger>
          <TabsTrigger value="logistica">
            Logística ({logisticaPending.length})
          </TabsTrigger>
          <TabsTrigger value="compra">
            Compra ({compraPending.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {requerimientos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No hay requerimientos pendientes de aprobación
                </p>
              </CardContent>
            </Card>
          ) : (
            requerimientos.map((req) => (
              <ApprovalCard
                key={req.id}
                requerimiento={req}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="seguridad" className="mt-4 space-y-4">
          {seguridadPending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No hay requerimientos pendientes de validación de seguridad
                </p>
              </CardContent>
            </Card>
          ) : (
            seguridadPending.map((req) => (
              <ApprovalCard
                key={req.id}
                requerimiento={req}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="gerencia" className="mt-4 space-y-4">
          {gerenciaPending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No hay requerimientos pendientes de validación de gerencia
                </p>
              </CardContent>
            </Card>
          ) : (
            gerenciaPending.map((req) => (
              <ApprovalCard
                key={req.id}
                requerimiento={req}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="logistica" className="mt-4 space-y-4">
          {logisticaPending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No hay requerimientos pendientes de revisión de logística
                </p>
              </CardContent>
            </Card>
          ) : (
            logisticaPending.map((req) => (
              <ApprovalCard
                key={req.id}
                requerimiento={req}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="compra" className="mt-4 space-y-4">
          {compraPending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No hay requerimientos pendientes de aprobación de compra
                </p>
              </CardContent>
            </Card>
          ) : (
            compraPending.map((req) => (
              <ApprovalCard
                key={req.id}
                requerimiento={req}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
