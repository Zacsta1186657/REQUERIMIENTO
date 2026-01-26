"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequerimientoGrid } from "@/components/requerimientos/requerimiento-grid";
import { RequerimientoTable } from "@/components/requerimientos/requerimiento-table";
import { ViewMode, ViewToggle } from "@/components/requerimientos/view-toggle";
import { useRequerimientosStore } from "@/stores/requerimientos-store";
import { RequerimientoStatus, STATUS_CONFIG } from "@/types";
import { Plus, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions: (RequerimientoStatus | "ALL")[] = [
  "ALL",
  "BORRADOR",
  "CREADO",
  "VALIDACION_SEGURIDAD",
  "APROBADO_SEGURIDAD",
  "VALIDACION_GERENCIA",
  "APROBADO_GERENCIA",
  "REVISION_LOGISTICA",
  "EN_COMPRA",
  "LISTO_DESPACHO",
  "ENVIADO",
  "ENTREGADO_PARCIAL",
  "ENTREGADO",
  "RECHAZADO_SEGURIDAD",
  "RECHAZADO_GERENCIA",
  "RECHAZADO_ADM",
];

export default function RequerimientosPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequerimientoStatus | "ALL">("ALL");

  const {
    requerimientos,
    pagination,
    isLoading,
    fetchRequerimientos,
    setFilters,
  } = useRequerimientosStore();

  const handleFetch = useCallback(() => {
    const filters: Record<string, string> = {};
    if (searchQuery) filters.search = searchQuery;
    if (statusFilter !== "ALL") filters.estado = statusFilter;
    setFilters(filters);
    fetchRequerimientos(1);
  }, [searchQuery, statusFilter, setFilters, fetchRequerimientos]);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleFetch]);

  const handlePageChange = (page: number) => {
    fetchRequerimientos(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requerimientos</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todos los requerimientos
          </p>
        </div>
        <Button asChild>
          <Link href="/requerimientos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Requerimiento
          </Link>
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as RequerimientoStatus | "ALL")}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {statusOptions.slice(1).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_CONFIG[status as RequerimientoStatus].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View toggle */}
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <>
            Mostrando {requerimientos.length} de {pagination?.total || 0}{" "}
            requerimientos
          </>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "table" ? (
        <RequerimientoTable
          requerimientos={requerimientos}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      ) : (
        <RequerimientoGrid
          requerimientos={requerimientos}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
