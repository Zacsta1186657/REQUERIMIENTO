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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Package,
  Loader2,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

import { ITEM_STATUS_CONFIG, type ItemStatus, isDispatchable } from "@/lib/workflow/item-transitions";

interface Item {
  id: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  categoria?: { nombre: string };
  unidadMedida?: { abreviatura: string };
  numeroParte?: string;
  marca?: string;
  modelo?: string;
  estadoItem: ItemStatus;
}

interface Lote {
  id: string;
  numero: number;
  estado: string;
  transportista: string | null;
  destino: string | null;
  fechaEnvio: string | null;
  fechaEstimadaLlegada: string | null;
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
  const [fechaEstimadaLlegada, setFechaEstimadaLlegada] = useState("");
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

  // Filtrar solo items despachables usando el estadoItem
  // Un item es despachable si su estado es LISTO_PARA_DESPACHO o DESPACHO_PARCIAL
  const itemsDespachables = items.filter((item) => isDispatchable(item.estadoItem));

  // Items pendientes de envío (solo despachables)
  const itemsPendientes = itemsDespachables.filter((item) => {
    const cantidadTotal = item.cantidadAprobada || item.cantidadSolicitada;
    const cantidadEnviada = cantidadesEnviadas[item.id] || 0;
    return cantidadEnviada < cantidadTotal;
  });

  // Calcular estadísticas de envío (solo sobre items despachables)
  const itemsCompletamenteEnviados = itemsDespachables.filter((item) => {
    const cantidadTotal = item.cantidadAprobada || item.cantidadSolicitada;
    const cantidadEnviada = cantidadesEnviadas[item.id] || 0;
    return cantidadEnviada >= cantidadTotal;
  }).length;

  const itemsParcialmenteEnviados = itemsDespachables.filter((item) => {
    const cantidadTotal = item.cantidadAprobada || item.cantidadSolicitada;
    const cantidadEnviada = cantidadesEnviadas[item.id] || 0;
    return cantidadEnviada > 0 && cantidadEnviada < cantidadTotal;
  }).length;

  // Calcular totales de cantidades (solo despachables)
  const totalCantidad = itemsDespachables.reduce((sum, item) => sum + (item.cantidadAprobada || item.cantidadSolicitada), 0);
  const totalEnviado = Object.values(cantidadesEnviadas).reduce((sum, cant) => sum + cant, 0);
  const porcentajeEnvio = totalCantidad > 0 ? Math.round((totalEnviado / totalCantidad) * 100) : 0;

  // Determinar estado general del envío
  const hayEnvioParcial = totalEnviado > 0 && totalEnviado < totalCantidad;
  const envioCompleto = totalEnviado >= totalCantidad;

  // Items en proceso de compra (no despachables aún)
  // Incluye: REQUIERE_COMPRA, PENDIENTE_VALIDACION_ADMIN, APROBADO_COMPRA
  const itemsEnProcesoCompra = items.filter((item) => {
    return ['REQUIERE_COMPRA', 'PENDIENTE_VALIDACION_ADMIN', 'APROBADO_COMPRA'].includes(item.estadoItem);
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
          fechaEstimadaLlegada: fechaEstimadaLlegada || undefined,
          observaciones: observaciones || undefined,
        }),
      });

      if (response.ok) {
        setShowCreateLote(false);
        setSelectedItems({});
        setTransportista("");
        setDestino("");
        setFechaEstimadaLlegada("");
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

  // IMPORTANTE: Mostrar el panel si hay items despachables, sin importar el estado del requerimiento
  // Esto permite despachar items en stock mientras otros están en proceso de compra
  const hayItemsDespachables = itemsDespachables.length > 0;
  const hayLotes = lotes.length > 0;

  // No mostrar si no hay items despachables ni lotes existentes
  if (!hayItemsDespachables && !hayLotes) {
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
        {/* Resumen de Estado de Envío */}
        <div className={`p-4 rounded-lg border-2 ${
          envioCompleto
            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
            : hayEnvioParcial
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
              : "bg-slate-50 dark:bg-slate-900/20 border-slate-300 dark:border-slate-700"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {envioCompleto ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : hayEnvioParcial ? (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              ) : (
                <Clock className="h-5 w-5 text-slate-500" />
              )}
              <span className="font-semibold text-sm">
                {envioCompleto
                  ? "ENVÍO COMPLETADO"
                  : hayEnvioParcial
                    ? "ENVÍO PARCIAL EN CURSO"
                    : "PENDIENTE DE ENVÍO"}
              </span>
            </div>
            <Badge variant={envioCompleto ? "default" : hayEnvioParcial ? "secondary" : "outline"}>
              {porcentajeEnvio}% enviado
            </Badge>
          </div>

          {/* Barra de progreso */}
          <Progress value={porcentajeEnvio} className="h-2 mb-3" />

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {itemsCompletamenteEnviados}
              </div>
              <div className="text-xs text-muted-foreground">Items completos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {itemsParcialmenteEnviados}
              </div>
              <div className="text-xs text-muted-foreground">Parciales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-500">
                {itemsPendientes.length - itemsParcialmenteEnviados}
              </div>
              <div className="text-xs text-muted-foreground">Sin enviar</div>
            </div>
          </div>
        </div>

        {/* Items en proceso de compra (no despachables aún) */}
        {itemsEnProcesoCompra.length > 0 && (
          <div className="p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                Items en Proceso de Compra
              </span>
              <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {itemsEnProcesoCompra.length} item{itemsEnProcesoCompra.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Estos items no están disponibles para despacho. Están pendientes de validación de compra o de recepción en almacén.
            </p>
            <div className="space-y-2">
              {itemsEnProcesoCompra.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.descripcion}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${ITEM_STATUS_CONFIG[item.estadoItem].bgColor} ${ITEM_STATUS_CONFIG[item.estadoItem].color}`}
                      >
                        {ITEM_STATUS_CONFIG[item.estadoItem].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-semibold">{item.cantidadAprobada || item.cantidadSolicitada}</span>
                    <span className="text-muted-foreground ml-1">{item.unidadMedida?.abreviatura}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Items Pendientes con detalle */}
        {itemsPendientes.length > 0 && !showCreateLote && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Items Pendientes de Envío
              </h4>
              <span className="text-xs text-muted-foreground">
                {totalCantidad - totalEnviado} unidades restantes
              </span>
            </div>
            <div className="space-y-2">
              {itemsPendientes.map((item) => {
                const cantidadTotal = item.cantidadAprobada || item.cantidadSolicitada;
                const cantidadEnviada = cantidadesEnviadas[item.id] || 0;
                const cantidadPendiente = cantidadTotal - cantidadEnviada;
                const progreso = Math.round((cantidadEnviada / cantidadTotal) * 100);

                return (
                  <div key={item.id} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.descripcion}</span>
                          {cantidadEnviada > 0 && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Parcial
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-x-3">
                          {item.numeroParte && <span>N° Parte: {item.numeroParte}</span>}
                          {item.marca && <span>Marca: {item.marca}</span>}
                          {item.modelo && <span>Modelo: {item.modelo}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-amber-600">
                          {cantidadPendiente} {item.unidadMedida?.abreviatura}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          de {cantidadTotal} pendiente
                        </div>
                      </div>
                    </div>
                    {cantidadEnviada > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress value={progreso} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground w-10">{progreso}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Lotes existentes */}
        {lotes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Historial de Lotes Enviados
              </h4>
              <span className="text-xs text-muted-foreground">
                {lotes.length} lote{lotes.length > 1 ? "s" : ""}
              </span>
            </div>
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
                {lote.fechaEstimadaLlegada && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Llegada estimada: {new Date(lote.fechaEstimadaLlegada).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    })}
                    <span className="text-amber-600 dark:text-amber-400">(estimación)</span>
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
                {hayEnvioParcial ? "Crear Lote Adicional (Envío Parcial)" : "Crear Nuevo Lote de Envío"}
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

                {/* Fecha estimada de llegada */}
                <div className="space-y-2">
                  <Label htmlFor="fechaEstimada" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Fecha Estimada de Llegada
                    <span className="text-xs text-muted-foreground font-normal">(Opcional - Solo estimación)</span>
                  </Label>
                  <Input
                    id="fechaEstimada"
                    type="date"
                    value={fechaEstimadaLlegada}
                    onChange={(e) => setFechaEstimadaLlegada(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta fecha es solo una estimación para informar al receptor cuándo podría llegar el lote.
                  </p>
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
          <div className="text-center py-6 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
            <p className="font-semibold text-lg">Todos los items han sido despachados</p>
            <p className="text-sm text-muted-foreground mt-1">
              {lotes.length} lote{lotes.length > 1 ? "s" : ""} enviado{lotes.length > 1 ? "s" : ""} • {totalEnviado} unidades totales
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
