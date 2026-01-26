"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RequerimientoListItem, Pagination } from "@/stores/requerimientos-store";
import { RequerimientoCard } from "./requerimiento-card";

interface RequerimientoGridProps {
  requerimientos: RequerimientoListItem[];
  pagination?: Pagination | null;
  onPageChange?: (page: number) => void;
}

export function RequerimientoGrid({
  requerimientos,
  pagination,
  onPageChange,
}: RequerimientoGridProps) {
  if (requerimientos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron requerimientos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {requerimientos.map((requerimiento) => (
          <RequerimientoCard key={requerimiento.id} requerimiento={requerimiento} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
