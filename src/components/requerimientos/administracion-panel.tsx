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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Package,
} from "lucide-react";
import { useState } from "react";
import { ITEM_STATUS_CONFIG, type ItemStatus, needsAdminValidation } from "@/lib/workflow/item-transitions";

interface Item {
  id: string;
  descripcion: string;
  numeroParte: string | null;
  marca: string | null;
  modelo: string | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  estadoItem: ItemStatus;
  requiereCompra: boolean | null;
  fechaEstimadaCompra: string | null;
  motivoStock: string | null;
  validadoCompra: boolean | null;
  observacionCompra: string | null;
  categoria?: { nombre: string };
  unidadMedida?: { abreviatura: string };
  validadoPor?: { id: string; nombre: string } | null;
}

interface AdministracionPanelProps {
  requerimientoId: string;
  items: Item[];
  estado: string;
  onUpdate: () => void;
  canValidatePurchase: boolean;
}

interface ItemValidation {
  validado: boolean;
  observacion: string;
}

export function AdministracionPanel({
  requerimientoId,
  items,
  estado,
  onUpdate,
  canValidatePurchase,
}: AdministracionPanelProps) {
  // Filtrar items que necesitan validación de administración usando estadoItem
  const itemsPendientesValidacion = items.filter(
    (item) => needsAdminValidation(item.estadoItem)
  );

  // Items que ya fueron procesados por administración (aprobados o rechazados)
  const itemsYaProcesados = items.filter(
    (item) => item.estadoItem === 'APROBADO_COMPRA' || item.estadoItem === 'RECHAZADO_COMPRA'
  );

  const [validations, setValidations] = useState<Record<string, ItemValidation>>(() => {
    const initial: Record<string, ItemValidation> = {};
    itemsPendientesValidacion.forEach((item) => {
      initial[item.id] = {
        validado: false,
        observacion: item.observacionCompra || "",
      };
    });
    return initial;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidationChange = (itemId: string, field: keyof ItemValidation, value: boolean | string) => {
    setValidations((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleProcess = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      const itemsToValidate = Object.entries(validations).map(([itemId, validation]) => ({
        itemId,
        validado: validation.validado,
        observacion: validation.observacion || undefined,
      }));

      const response = await fetch(
        `/api/requerimientos/${requerimientoId}/items/validate-purchase`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsToValidate }),
        }
      );

      if (response.ok) {
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al procesar la validacion");
      }
    } catch (err) {
      setError("Error de conexion");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate summary
  const itemsAprobados = Object.values(validations).filter((v) => v.validado).length;
  const itemsRechazados = itemsPendientesValidacion.length - itemsAprobados;

  // No mostrar si no hay permisos
  if (!canValidatePurchase) {
    return null;
  }

  // Si no hay items pendientes de validación ni ya procesados, no mostrar
  if (itemsPendientesValidacion.length === 0 && itemsYaProcesados.length === 0) {
    return null;
  }

  // Si no hay items pendientes pero sí hay procesados, mostrar resumen
  if (itemsPendientesValidacion.length === 0 && itemsYaProcesados.length > 0) {
    const approved = itemsYaProcesados.filter((item) => item.estadoItem === 'APROBADO_COMPRA');
    const rejected = itemsYaProcesados.filter((item) => item.estadoItem === 'RECHAZADO_COMPRA');

    return (
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            Validación de Compras
          </CardTitle>
          <CardDescription>
            Estado de las validaciones de compra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aprobados: {approved.length}
            </Badge>
            {rejected.length > 0 && (
              <Badge variant="outline" className="text-red-600 border-red-300">
                <XCircle className="h-3 w-3 mr-1" />
                Rechazados: {rejected.length}
              </Badge>
            )}
          </div>

          {/* Lista de items procesados */}
          <div className="space-y-2">
            {itemsYaProcesados.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{item.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.cantidadAprobada || item.cantidadSolicitada} {item.unidadMedida?.abreviatura}
                  </p>
                </div>
                <Badge className={`${ITEM_STATUS_CONFIG[item.estadoItem].bgColor} ${ITEM_STATUS_CONFIG[item.estadoItem].color}`}>
                  {ITEM_STATUS_CONFIG[item.estadoItem].label}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          Validación de Compras
        </CardTitle>
        <CardDescription>
          Valida los items que requieren compra. Cada item se procesa de forma independiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendientes: {itemsPendientesValidacion.length}
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Marcados para aprobar: {itemsAprobados}
          </Badge>
          {itemsYaProcesados.length > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              <Package className="h-3 w-3 mr-1" />
              Ya procesados: {itemsYaProcesados.length}
            </Badge>
          )}
        </div>

        {/* Items pendientes de validación */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Items Pendientes de Validación
            <Badge variant="secondary">{itemsPendientesValidacion.length}</Badge>
          </h4>

          {itemsPendientesValidacion.map((item) => {
            const validation = validations[item.id];

            return (
              <div
                key={item.id}
                className={`p-4 border rounded-lg space-y-3 transition-colors ${
                  validation?.validado
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200"
                    : "bg-muted/30"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{item.descripcion}</p>
                    <Badge className={`${ITEM_STATUS_CONFIG[item.estadoItem].bgColor} ${ITEM_STATUS_CONFIG[item.estadoItem].color}`}>
                      {ITEM_STATUS_CONFIG[item.estadoItem].label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground mt-1">
                    {item.numeroParte && <span>Nº Parte: {item.numeroParte}</span>}
                    {item.marca && <span>Marca: {item.marca}</span>}
                    {item.modelo && <span>Modelo: {item.modelo}</span>}
                    <span>{item.categoria?.nombre}</span>
                    <span>
                      Cantidad: {item.cantidadAprobada || item.cantidadSolicitada}{" "}
                      {item.unidadMedida?.abreviatura}
                    </span>
                  </div>
                  {item.fechaEstimadaCompra && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Fecha estimada: {new Date(item.fechaEstimadaCompra).toLocaleDateString("es-ES")}
                    </p>
                  )}
                  {item.motivoStock && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Observación logística: {item.motivoStock}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`validar-${item.id}`}
                      checked={validation?.validado || false}
                      onCheckedChange={(checked) =>
                        handleValidationChange(item.id, "validado", checked === true)
                      }
                    />
                    <label
                      htmlFor={`validar-${item.id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Aprobar compra
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`obs-${item.id}`} className="text-xs">
                      Observaciones (opcional)
                    </Label>
                    <Textarea
                      id={`obs-${item.id}`}
                      value={validation?.observacion || ""}
                      onChange={(e) =>
                        handleValidationChange(item.id, "observacion", e.target.value)
                      }
                      placeholder="Agregar observaciones sobre la compra..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Items ya procesados */}
        {itemsYaProcesados.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">Items Ya Procesados</h4>
            {itemsYaProcesados.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{item.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.cantidadAprobada || item.cantidadSolicitada} {item.unidadMedida?.abreviatura}
                    {item.validadoPor && ` • Validado por ${item.validadoPor.nombre}`}
                  </p>
                </div>
                <Badge className={`${ITEM_STATUS_CONFIG[item.estadoItem].bgColor} ${ITEM_STATUS_CONFIG[item.estadoItem].color}`}>
                  {ITEM_STATUS_CONFIG[item.estadoItem].label}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Marca cada item como aprobado si la compra procede. Los items no marcados serán considerados como rechazados.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || itemsPendientesValidacion.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Procesar Validación ({itemsPendientesValidacion.length} item{itemsPendientesValidacion.length !== 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
