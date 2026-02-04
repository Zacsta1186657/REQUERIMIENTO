"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  PackageCheck,
  Loader2,
  ShoppingCart,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { type ItemStatus, needsWarehouseReception } from "@/lib/workflow/item-transitions";

interface Item {
  id: string;
  descripcion: string;
  numeroParte: string | null;
  marca: string | null;
  modelo: string | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  estadoItem: ItemStatus;
  motivoStock: string | null;
  fechaEstimadaCompra: string | null;
  categoria?: { nombre: string };
  unidadMedida?: { abreviatura: string };
}

interface RecepcionComprasPanelProps {
  requerimientoId: string;
  items: Item[];
  estado: string;
  onUpdate: () => void;
  canConfirmPurchaseReceived: boolean;
}

export function RecepcionComprasPanel({
  requerimientoId,
  items,
  estado,
  onUpdate,
  canConfirmPurchaseReceived,
}: RecepcionComprasPanelProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar items que fueron validados para compra pero aún no han llegado al almacén
  // Son items con estadoItem === 'APROBADO_COMPRA'
  const itemsPendientesRecepcion = items.filter(
    (item) => needsWarehouseReception(item.estadoItem)
  );

  const handleItemSelect = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
  };

  const handleSelectAll = () => {
    const allSelected = itemsPendientesRecepcion.every(
      (item) => selectedItems[item.id]
    );
    const newSelection: Record<string, boolean> = {};
    itemsPendientesRecepcion.forEach((item) => {
      newSelection[item.id] = !allSelected;
    });
    setSelectedItems(newSelection);
  };

  const handleConfirmReceived = async () => {
    const itemsToConfirm = Object.entries(selectedItems)
      .filter(([, selected]) => selected)
      .map(([id]) => id);

    if (itemsToConfirm.length === 0) {
      setError("Debe seleccionar al menos un item");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/requerimientos/${requerimientoId}/items/confirm-purchase-received`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIds: itemsToConfirm }),
        }
      );

      if (response.ok) {
        setSelectedItems({});
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al confirmar recepción");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  // No mostrar si no hay permisos o no hay items pendientes
  if (!canConfirmPurchaseReceived || itemsPendientesRecepcion.length === 0) {
    return null;
  }

  // Mostrar en cualquier estado donde haya items con compra aprobada pendientes de recepción
  // El control real se hace por el estadoItem de cada item (APROBADO_COMPRA)

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const allSelected =
    itemsPendientesRecepcion.length > 0 &&
    itemsPendientesRecepcion.every((item) => selectedItems[item.id]);

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-purple-600" />
          Recepción de Compras en Almacén
        </CardTitle>
        <CardDescription>
          Confirma que los items comprados ya llegaron al almacén para habilitarlos para despacho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Información */}
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Los siguientes items fueron aprobados para compra. Una vez que lleguen al almacén,
            márcalos como recibidos para que estén disponibles para despacho.
          </p>
        </div>

        {/* Seleccionar todos */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Seleccionar todos
            </label>
          </div>
          <Badge variant="outline">
            {selectedCount} de {itemsPendientesRecepcion.length} seleccionados
          </Badge>
        </div>

        {/* Lista de items */}
        <div className="space-y-3">
          {itemsPendientesRecepcion.map((item) => (
            <div
              key={item.id}
              className={`p-3 border rounded-lg transition-colors ${
                selectedItems[item.id]
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
                  : "bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={selectedItems[item.id] || false}
                  onCheckedChange={(checked) =>
                    handleItemSelect(item.id, checked === true)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`item-${item.id}`}
                    className="font-medium cursor-pointer block"
                  >
                    {item.descripcion}
                  </label>
                  <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground mt-1">
                    {item.numeroParte && <span>Nº Parte: {item.numeroParte}</span>}
                    {item.marca && <span>Marca: {item.marca}</span>}
                    {item.modelo && <span>Modelo: {item.modelo}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {item.cantidadAprobada || item.cantidadSolicitada} {item.unidadMedida?.abreviatura}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Compra validada
                    </Badge>
                    {item.fechaEstimadaCompra && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Est: {new Date(item.fechaEstimadaCompra).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  {item.motivoStock && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Obs: {item.motivoStock}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón de confirmación */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleConfirmReceived}
            disabled={isProcessing || selectedCount === 0}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PackageCheck className="h-4 w-4 mr-2" />
            )}
            Confirmar Recepción de {selectedCount} Item{selectedCount !== 1 ? "s" : ""} en Almacén
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
