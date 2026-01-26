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
  Truck,
  Package,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { useState } from "react";

interface Item {
  id: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  categoria?: { nombre: string };
  unidadMedida?: { abreviatura: string };
}

interface Lote {
  id: string;
  numero: number;
  estado: string;
  transportista: string | null;
  destino: string | null;
  fechaEnvio: string | null;
  items: {
    id: string;
    cantidadEnviada: number;
    requerimientoItem: Item;
  }[];
}

interface DespachoPanelProps {
  requerimientoId: string;
  items: Item[];
  lotes: Lote[];
  estado: string;
  onUpdate: () => void;
  canCreateLote: boolean;
  canDispatch: boolean;
}

export function DespachoPanel({
  requerimientoId,
  items,
  lotes = [],
  estado,
  onUpdate,
  canCreateLote,
  canDispatch,
}: DespachoPanelProps) {
  const [showCreateLote, setShowCreateLote] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [transportista, setTransportista] = useState("");
  const [destino, setDestino] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calcular cantidades ya enviadas por item
  const cantidadesEnviadas: Record<string, number> = {};
  lotes.forEach((lote) => {
    lote.items.forEach((loteItem) => {
      const itemId = loteItem.requerimientoItem?.id;
      if (itemId) {
        cantidadesEnviadas[itemId] = (cantidadesEnviadas[itemId] || 0) + loteItem.cantidadEnviada;
      }
    });
  });

  // Items pendientes de envío
  const itemsPendientes = items.filter((item) => {
    const cantidadTotal = item.cantidadAprobada || item.cantidadSolicitada;
    const cantidadEnviada = cantidadesEnviadas[item.id] || 0;
    return cantidadEnviada < cantidadTotal;
  });

  const handleItemSelect = (itemId: string, cantidad: number) => {
    if (cantidad > 0) {
      setSelectedItems((prev) => ({ ...prev, [itemId]: cantidad }));
    } else {
      setSelectedItems((prev) => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
    }
  };

  const handleCreateLote = async () => {
    if (Object.keys(selectedItems).length === 0) {
      setError("Debe seleccionar al menos un item");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requerimientoId,
          items: Object.entries(selectedItems).map(([requerimientoItemId, cantidadEnviada]) => ({
            requerimientoItemId,
            cantidadEnviada,
          })),
          transportista: transportista || undefined,
          destino: destino || undefined,
          observaciones: observaciones || undefined,
        }),
      });

      if (response.ok) {
        setShowCreateLote(false);
        setSelectedItems({});
        setTransportista("");
        setDestino("");
        setObservaciones("");
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al crear lote");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDispatch = async (loteId: string) => {
    setIsDispatching(loteId);
    setError(null);

    try {
      const response = await fetch(`/api/lotes/${loteId}/dispatch`, {
        method: "POST",
      });

      if (response.ok) {
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al despachar");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsDispatching(null);
    }
  };

  if (!canCreateLote && !canDispatch) {
    return null;
  }

  if (estado !== "LISTO_DESPACHO" && estado !== "ENVIADO" && estado !== "ENTREGADO_PARCIAL") {
    return null;
  }

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-green-600" />
          Despacho y Envío
        </CardTitle>
        <CardDescription>
          Prepara y envía los lotes del requerimiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Lotes existentes */}
        {lotes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Lotes Creados</h4>
            {lotes.map((lote) => (
              <div
                key={lote.id}
                className="p-3 border rounded-lg bg-muted/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Lote #{lote.numero}</span>
                    <Badge
                      variant={lote.estado === "DESPACHADO" || lote.estado === "EN_TRANSITO" ? "default" : "secondary"}
                    >
                      {lote.estado === "PENDIENTE" ? "Pendiente de envío" :
                       lote.estado === "DESPACHADO" ? "Despachado" :
                       lote.estado === "EN_TRANSITO" ? "En Tránsito" :
                       lote.estado === "ENTREGADO" ? "Entregado" : lote.estado}
                    </Badge>
                  </div>
                  {lote.estado === "PENDIENTE" && canDispatch && (
                    <Button
                      size="sm"
                      onClick={() => handleDispatch(lote.id)}
                      disabled={isDispatching === lote.id}
                    >
                      {isDispatching === lote.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Enviar
                    </Button>
                  )}
                </div>
                {lote.transportista && (
                  <p className="text-xs text-muted-foreground">
                    Transportista: {lote.transportista}
                  </p>
                )}
                {lote.destino && (
                  <p className="text-xs text-muted-foreground">
                    Destino: {lote.destino}
                  </p>
                )}
                <div className="text-xs">
                  {lote.items.map((loteItem) => (
                    <span key={loteItem.id} className="mr-3">
                      • {loteItem.requerimientoItem?.descripcion}: {loteItem.cantidadEnviada}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Crear nuevo lote */}
        {canCreateLote && itemsPendientes.length > 0 && (
          <>
            {!showCreateLote ? (
              <Button
                variant="outline"
                onClick={() => setShowCreateLote(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Lote de Envío
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium">Nuevo Lote</h4>

                {/* Selección de items */}
                <div className="space-y-2">
                  <Label className="text-sm">Seleccionar Items</Label>
                  {itemsPendientes.map((item) => {
                    const cantidadTotal = item.cantidadAprobada || item.cantidadSolicitada;
                    const cantidadEnviada = cantidadesEnviadas[item.id] || 0;
                    const cantidadPendiente = cantidadTotal - cantidadEnviada;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 border rounded"
                      >
                        <Checkbox
                          checked={!!selectedItems[item.id]}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleItemSelect(item.id, cantidadPendiente);
                            } else {
                              handleItemSelect(item.id, 0);
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.descripcion}</p>
                          <p className="text-xs text-muted-foreground">
                            Pendiente: {cantidadPendiente} {item.unidadMedida?.abreviatura}
                          </p>
                        </div>
                        {selectedItems[item.id] && (
                          <Input
                            type="number"
                            min={1}
                            max={cantidadPendiente}
                            value={selectedItems[item.id]}
                            onChange={(e) =>
                              handleItemSelect(item.id, parseInt(e.target.value) || 0)
                            }
                            className="w-20 h-8"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Información del envío */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="transportista">Transportista</Label>
                    <Input
                      id="transportista"
                      value={transportista}
                      onChange={(e) => setTransportista(e.target.value)}
                      placeholder="Nombre del transportista"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino</Label>
                    <Input
                      id="destino"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      placeholder="Dirección de destino"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateLote(false);
                      setSelectedItems({});
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateLote}
                    disabled={isCreating || Object.keys(selectedItems).length === 0}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4 mr-2" />
                    )}
                    Crear Lote
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mensaje si todo está enviado */}
        {itemsPendientes.length === 0 && lotes.length > 0 && (
          <div className="text-center py-4 text-green-600">
            <Truck className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Todos los items han sido despachados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
