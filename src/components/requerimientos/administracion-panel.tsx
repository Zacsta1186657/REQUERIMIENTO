"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  decision: 'aprobar' | 'rechazar' | null;
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
        decision: null,
        observacion: item.observacionCompra || "",
      };
    });
    return initial;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidationChange = (itemId: string, field: keyof ItemValidation, value: 'aprobar' | 'rechazar' | null | string) => {
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

    // Validar que todos los ítems tengan una decisión
    const itemsSinDecision = Object.entries(validations).filter(([, v]) => v.decision === null);
    if (itemsSinDecision.length > 0) {
      setError(`Hay ${itemsSinDecision.length} ítem(s) sin decisión. Debe aprobar o rechazar cada ítem.`);
      return;
    }

    // Validar que los rechazados tengan observación obligatoria
    const rechazadosSinObservacion = Object.entries(validations).filter(
      ([, v]) => v.decision === 'rechazar' && (!v.observacion || v.observacion.trim().length < 10)
    );
    if (rechazadosSinObservacion.length > 0) {
      setError(`Los ítems rechazados requieren una observación de al menos 10 caracteres. Faltan ${rechazadosSinObservacion.length} ítem(s).`);
      return;
    }

    setIsProcessing(true);

    try {
      const itemsToValidate = Object.entries(validations).map(([itemId, validation]) => ({
        itemId,
        validado: validation.decision === 'aprobar',
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
  const itemsAprobados = Object.values(validations).filter((v) => v.decision === 'aprobar').length;
  const itemsRechazados = Object.values(validations).filter((v) => v.decision === 'rechazar').length;
  const itemsSinDecision = Object.values(validations).filter((v) => v.decision === null).length;

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
          {itemsSinDecision > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Clock className="h-3 w-3 mr-1" />
              Sin decisión: {itemsSinDecision}
            </Badge>
          )}
          {itemsAprobados > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Para aprobar: {itemsAprobados}
            </Badge>
          )}
          {itemsRechazados > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-300">
              <XCircle className="h-3 w-3 mr-1" />
              Para rechazar: {itemsRechazados}
            </Badge>
          )}
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
                  validation?.decision === 'aprobar'
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200"
                    : validation?.decision === 'rechazar'
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200"
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
                  {/* Botones de decisión */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Decisión</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleValidationChange(item.id, "decision", "aprobar")}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          validation?.decision === "aprobar"
                            ? "border-green-500 bg-green-100 dark:bg-green-900/40"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className={`h-5 w-5 ${
                            validation?.decision === "aprobar" ? "text-green-600" : "text-gray-400"
                          }`} />
                          <span className={`font-medium ${
                            validation?.decision === "aprobar" ? "text-green-700" : "text-gray-600"
                          }`}>
                            Aprobar
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleValidationChange(item.id, "decision", "rechazar")}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          validation?.decision === "rechazar"
                            ? "border-red-500 bg-red-100 dark:bg-red-900/40"
                            : "border-gray-200 hover:border-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className={`h-5 w-5 ${
                            validation?.decision === "rechazar" ? "text-red-600" : "text-gray-400"
                          }`} />
                          <span className={`font-medium ${
                            validation?.decision === "rechazar" ? "text-red-700" : "text-gray-600"
                          }`}>
                            Rechazar
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Observación - obligatoria para rechazos */}
                  <div className="space-y-2">
                    <Label htmlFor={`obs-${item.id}`} className="text-xs flex items-center gap-1">
                      Observaciones
                      {validation?.decision === "rechazar" ? (
                        <span className="text-red-600 font-semibold">(Obligatorio - mín. 10 caracteres)</span>
                      ) : (
                        <span className="text-muted-foreground">(opcional)</span>
                      )}
                    </Label>
                    <Textarea
                      id={`obs-${item.id}`}
                      value={validation?.observacion || ""}
                      onChange={(e) =>
                        handleValidationChange(item.id, "observacion", e.target.value)
                      }
                      placeholder={
                        validation?.decision === "rechazar"
                          ? "Ingrese el motivo del rechazo (obligatorio)..."
                          : "Agregar observaciones sobre la compra..."
                      }
                      rows={2}
                      className={`text-sm ${
                        validation?.decision === "rechazar" && (!validation?.observacion || validation.observacion.trim().length < 10)
                          ? "border-red-300 focus:border-red-500"
                          : ""
                      }`}
                    />
                    {validation?.decision === "rechazar" && validation?.observacion && validation.observacion.trim().length < 10 && (
                      <p className="text-xs text-red-600">
                        Faltan {10 - validation.observacion.trim().length} caracteres
                      </p>
                    )}
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Seleccione <strong>Aprobar</strong> o <strong>Rechazar</strong> para cada ítem.</p>
            <p className="text-red-600">Los ítems rechazados requieren una observación obligatoria y quedarán descartados del flujo.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || itemsPendientesValidacion.length === 0 || itemsSinDecision > 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {itemsSinDecision > 0
                ? `Faltan ${itemsSinDecision} decisión(es)`
                : `Procesar Validación (${itemsAprobados} aprobado${itemsAprobados !== 1 ? 's' : ''}, ${itemsRechazados} rechazado${itemsRechazados !== 1 ? 's' : ''})`
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
