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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Truck,
  Save,
} from "lucide-react";
import { useState } from "react";

interface Item {
  id: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  enStock: boolean | null;
  requiereCompra: boolean | null;
  motivoStock: string | null;
  fechaEstimadaCompra: string | null;
  categoria?: { nombre: string };
  unidadMedida?: { abreviatura: string };
}

interface LogisticaPanelProps {
  requerimientoId: string;
  items: Item[];
  estado: string;
  onUpdate: () => void;
  canMarkStock: boolean;
}

interface ItemStockStatus {
  enStock: boolean;
  requiereCompra: boolean;
  cantidadAprobada: number;
  motivoStock: string;
  fechaEstimadaCompra: string;
}

export function LogisticaPanel({
  requerimientoId,
  items,
  estado,
  onUpdate,
  canMarkStock,
}: LogisticaPanelProps) {
  const [stockStatus, setStockStatus] = useState<Record<string, ItemStockStatus>>(() => {
    const initial: Record<string, ItemStockStatus> = {};
    items.forEach((item) => {
      initial[item.id] = {
        enStock: item.enStock ?? false,
        requiereCompra: item.requiereCompra ?? false,
        cantidadAprobada: item.cantidadAprobada ?? item.cantidadSolicitada,
        motivoStock: item.motivoStock || "",
        fechaEstimadaCompra: item.fechaEstimadaCompra || "",
      };
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStockChange = (itemId: string, field: keyof ItemStockStatus, value: boolean | number | string) => {
    setStockStatus((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
        // Si marca en stock, desmarcar requiere compra y viceversa
        ...(field === "enStock" && value === true ? { requiereCompra: false } : {}),
        ...(field === "requiereCompra" && value === true ? { enStock: false } : {}),
      },
    }));
  };

  const handleSaveItem = async (itemId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const status = stockStatus[itemId];
      const response = await fetch(`/api/requerimientos/${requerimientoId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enStock: status.enStock,
          requiereCompra: status.requiereCompra,
          cantidadAprobada: status.cantidadAprobada,
          motivoStock: status.motivoStock || null,
          fechaEstimadaCompra: status.fechaEstimadaCompra || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al guardar");
      } else {
        onUpdate();
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);
    try {
      for (const itemId of Object.keys(stockStatus)) {
        const status = stockStatus[itemId];
        await fetch(`/api/requerimientos/${requerimientoId}/items/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enStock: status.enStock,
            requiereCompra: status.requiereCompra,
            cantidadAprobada: status.cantidadAprobada,
            motivoStock: status.motivoStock || null,
            fechaEstimadaCompra: status.fechaEstimadaCompra || null,
          }),
        });
      }
      onUpdate();
    } catch (err) {
      setError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProcess = async (action: "stock" | "compra" | "mixto") => {
    setIsProcessing(true);
    setError(null);

    try {
      // Primero guardar todos los items
      await handleSaveAll();

      // Luego procesar según la acción
      let nextStatus = "";
      if (action === "stock") {
        nextStatus = "LISTO_DESPACHO";
      } else if (action === "compra") {
        nextStatus = "EN_COMPRA";
      } else {
        // Mixto: algunos en stock, otros requieren compra
        const hasCompra = Object.values(stockStatus).some((s) => s.requiereCompra);
        nextStatus = hasCompra ? "EN_COMPRA" : "LISTO_DESPACHO";
      }

      const response = await fetch(`/api/requerimientos/${requerimientoId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nextStatus }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al procesar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calcular resumen
  const itemsEnStock = Object.values(stockStatus).filter((s) => s.enStock).length;
  const itemsCompra = Object.values(stockStatus).filter((s) => s.requiereCompra).length;
  const itemsSinClasificar = items.length - itemsEnStock - itemsCompra;

  if (!canMarkStock || estado !== "REVISION_LOGISTICA") {
    return null;
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Revisión de Logística
        </CardTitle>
        <CardDescription>
          Clasifica cada ítem según disponibilidad de stock
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Resumen */}
        <div className="flex gap-4">
          <Badge variant="outline" className="text-green-600 border-green-300">
            <Package className="h-3 w-3 mr-1" />
            En Stock: {itemsEnStock}
          </Badge>
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Requiere Compra: {itemsCompra}
          </Badge>
          {itemsSinClasificar > 0 && (
            <Badge variant="outline" className="text-gray-600">
              Sin clasificar: {itemsSinClasificar}
            </Badge>
          )}
        </div>

        {/* Lista de items */}
        <div className="space-y-4">
          {items.map((item) => {
            const status = stockStatus[item.id];
            return (
              <div
                key={item.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.descripcion}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.categoria?.nombre} • Solicitado: {item.cantidadSolicitada} {item.unidadMedida?.abreviatura}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveItem(item.id)}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Clasificación */}
                  <div className="space-y-2">
                    <Label className="text-xs">Clasificación</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`stock-${item.id}`}
                          checked={status.enStock}
                          onCheckedChange={(checked) =>
                            handleStockChange(item.id, "enStock", checked === true)
                          }
                        />
                        <label
                          htmlFor={`stock-${item.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                        >
                          <Package className="h-3 w-3 text-green-600" />
                          En Stock
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`compra-${item.id}`}
                          checked={status.requiereCompra}
                          onCheckedChange={(checked) =>
                            handleStockChange(item.id, "requiereCompra", checked === true)
                          }
                        />
                        <label
                          htmlFor={`compra-${item.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1"
                        >
                          <ShoppingCart className="h-3 w-3 text-orange-600" />
                          Requiere Compra
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cantidad aprobada */}
                  <div className="space-y-2">
                    <Label htmlFor={`cantidad-${item.id}`} className="text-xs">
                      Cantidad Aprobada
                    </Label>
                    <Input
                      id={`cantidad-${item.id}`}
                      type="number"
                      min={1}
                      max={item.cantidadSolicitada}
                      value={status.cantidadAprobada}
                      onChange={(e) =>
                        handleStockChange(item.id, "cantidadAprobada", parseInt(e.target.value) || 0)
                      }
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Campos adicionales si requiere compra */}
                {status.requiereCompra && (
                  <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor={`fecha-${item.id}`} className="text-xs">
                        Fecha Estimada de Compra
                      </Label>
                      <Input
                        id={`fecha-${item.id}`}
                        type="date"
                        value={status.fechaEstimadaCompra}
                        onChange={(e) =>
                          handleStockChange(item.id, "fechaEstimadaCompra", e.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`motivo-${item.id}`} className="text-xs">
                        Observaciones
                      </Label>
                      <Input
                        id={`motivo-${item.id}`}
                        value={status.motivoStock}
                        onChange={(e) =>
                          handleStockChange(item.id, "motivoStock", e.target.value)
                        }
                        placeholder="Motivo o proveedor..."
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Una vez clasificados todos los ítems, selecciona cómo procesar el requerimiento:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleProcess("stock")}
              disabled={isProcessing || itemsEnStock === 0 || itemsCompra > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Todo en Stock - Listo para Despacho
            </Button>
            <Button
              onClick={() => handleProcess("compra")}
              disabled={isProcessing || itemsCompra === 0}
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Enviar a Compras
            </Button>
            {itemsEnStock > 0 && itemsCompra > 0 && (
              <Button
                onClick={() => handleProcess("mixto")}
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Procesar Mixto (Stock + Compra)
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
