"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "./status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RequerimientoListItem, Pagination } from "@/stores/requerimientos-store";

interface RequerimientoTableProps {
  requerimientos: RequerimientoListItem[];
  pagination?: Pagination | null;
  onPageChange?: (page: number) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function RequerimientoTable({
  requerimientos,
  pagination,
  onPageChange,
}: RequerimientoTableProps) {
  if (requerimientos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron requerimientos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">N° Requerimiento</TableHead>
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Operación</TableHead>
              <TableHead className="w-[180px]">Estado</TableHead>
              <TableHead className="text-center w-[80px]">Items</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requerimientos.map((req) => {
              const initials = req.solicitante.nombre
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/requerimientos/${req.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {req.numero}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(req.fecha)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[150px]">
                        {req.solicitante.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-[150px]">
                    {req.operacion.nombre}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.estado} />
                  </TableCell>
                  <TableCell className="text-center">
                    {req._count?.items || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/requerimientos/${req.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Más opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/requerimientos/${req.id}`}>
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicar</DropdownMenuItem>
                          <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
