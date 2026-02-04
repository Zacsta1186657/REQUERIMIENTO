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
} from "lucide-react";
import { useState } from "react";

interface Item {
  id: string;
  descripcion: string;
  numeroParte: string | null;
  marca: string | null;
  modelo: string | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
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
  // Filter only items that require purchase
  const purchaseItems = items.filter((item) => item.requiereCompra === true);

  const [validations, setValidations] = useState<Record<string, ItemValidation>>(() => {
    const initial: Record<string, ItemValidation> = {};
    purchaseItems.forEach((item) => {
      initial[item.id] = {
        validado: item.validadoCompra ?? false,
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
  const itemsRechazados = purchaseItems.length - itemsAprobados;
  const allValidated = purchaseItems.every((item) => item.validadoCompra !== null);

  // Don't show if not in EN_COMPRA or no permission or no purchase items
  if (!canValidatePurchase || estado !== "EN_COMPRA" || purchaseItems.length === 0) {
    return null;
  }

  // If all items already validated, show summary
  if (allValidated) {
    const approved = purchaseItems.filter((item) => item.validadoCompra === true);
    const rejected = purchaseItems.filter((item) => item.validadoCompra === false);

    return (
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            Validacion de Compras Completada
          </CardTitle>
          <CardDescription>
            Todas las compras han sido validadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aprobados: {approved.length}
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-300">
              <XCircle className="h-3 w-3 mr-1" />
              Rechazados: {rejected.length}
            </Badge>
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
          Validacion de Compras
        </CardTitle>
        <CardDescription>
          Valida los items que requieren compra antes de autorizar el despacho
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
        <div className="flex gap-4">
          <Badge variant="outline" className="text-green-600 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobados: {itemsAprobados}
          </Badge>
          <Badge variant="outline" className="text-red-600 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Pendientes/Rechazados: {itemsRechazados}
          </Badge>
          <Badge variant="outline" className="text-purple-600 border-purple-300">
            <CreditCard className="h-3 w-3 mr-1" />
            Total Compras: {purchaseItems.length}
          </Badge>
        </div>

        {/* Items list */}
        <div className="space-y-4">
          {purchaseItems.map((item) => {
            const validation = validations[item.id];
            const isAlreadyValidated = item.validadoCompra !== null;

            return (
              <div
                key={item.id}
                className={`p-4 border rounded-lg space-y-3 ${
                  isAlreadyValidated
                    ? "bg-muted/50"
                    : validation.validado
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200"
                    : "bg-muted/30"
                }`}
              >
                <div>
                  <p className="font-medium">{item.descripcion}</p>
                  <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    {item.numeroParte && <span>N Parte: {item.numeroParte}</span>}
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
                      Observacion logistica: {item.motivoStock}
                    </p>
                  )}
                </div>

                {isAlreadyValidated ? (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {item.validadoCompra ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprobado
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rechazado
                      </Badge>
                    )}
                    {item.validadoPor && (
                      <span className="text-xs text-muted-foreground">
                        por {item.validadoPor.nombre}
                      </span>
                    )}
                    {item.observacionCompra && (
                      <span className="text-xs text-muted-foreground ml-2">
                        - {item.observacionCompra}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`validar-${item.id}`}
                        checked={validation.validado}
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
                        value={validation.observacion}
                        onChange={(e) =>
                          handleValidationChange(item.id, "observacion", e.target.value)
                        }
                        placeholder="Agregar observaciones sobre la compra..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {!allValidated && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Marca cada item como aprobado si la compra procede. Los items no marcados seran considerados como rechazados.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Procesar Validacion
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
