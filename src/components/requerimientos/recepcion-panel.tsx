"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  PackageCheck,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
} from "lucide-react";
import { useState } from "react";

interface LoteItem {
  id: string;
  cantidadEnviada: number;
  cantidadRecibida: number | null;
  requerimientoItem: {
    id: string;
    descripcion: string;
    numeroParte: string | null;
    marca: string | null;
    modelo: string | null;
    categoria?: { nombre: string };
    unidadMedida?: { abreviatura: string };
  };
}

interface Lote {
  id: string;
  numero: number;
  estado: string;
  transportista: string | null;
  destino: string | null;
  fechaEnvio: string | null;
  fechaRecepcion: string | null;
  items: LoteItem[];
}

interface RequerimientoItem {
  id: string;
  descripcion: string;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  numeroParte?: string;
  marca?: string;
  modelo?: string;
  unidadMedida?: { abreviatura: string };
}

interface RecepcionPanelProps {
  requerimientoId: string;
  lotes: Lote[];
  items: RequerimientoItem[];
  estado: string;
  onUpdate: () => void;
  canConfirmDelivery: boolean;
}

export function RecepcionPanel({
  requerimientoId,
  lotes = [],
  items = [],
  estado,
  onUpdate,
  canConfirmDelivery,
}: RecepcionPanelProps) {
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState<Record<string, number>>({});
  const [observaciones, setObservaciones] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lotesEnviados = lotes.filter((lote) => lote.estado === "DESPACHADO" || lote.estado === "EN_TRANSITO");
  const lotesRecibidos = lotes.filter((lote) => lote.estado === "ENTREGADO");

  // Calcular cantidades recibidas por item del requerimiento
  const cantidadesRecibidasPorItem: Record<string, number> = {};
  lotesRecibidos.forEach((lote) => {
    lote.items.forEach((loteItem) => {
      const itemId = loteItem.requerimientoItem?.id;
      if (itemId) {
        cantidadesRecibidasPorItem[itemId] =
          (cantidadesRecibidasPorItem[itemId] || 0) +
          (loteItem.cantidadRecibida ?? loteItem.cantidadEnviada);
      }
    });
  });

  // Calcular estadísticas generales
  const totalCantidadRequerida = items.reduce(
    (sum, item) => sum + (item.cantidadAprobada ?? item.cantidadSolicitada),
    0
  );
  const totalCantidadRecibida = Object.values(cantidadesRecibidasPorItem).reduce(
    (sum, cant) => sum + cant,
    0
  );
  const porcentajeRecibido = totalCantidadRequerida > 0
    ? Math.round((totalCantidadRecibida / totalCantidadRequerida) * 100)
    : 0;

  // Items completamente recibidos vs pendientes
  const itemsCompletamenteRecibidos = items.filter((item) => {
    const requerido = item.cantidadAprobada ?? item.cantidadSolicitada;
    const recibido = cantidadesRecibidasPorItem[item.id] || 0;
    return recibido >= requerido;
  }).length;

  const itemsParcialmenteRecibidos = items.filter((item) => {
    const requerido = item.cantidadAprobada ?? item.cantidadSolicitada;
    const recibido = cantidadesRecibidasPorItem[item.id] || 0;
    return recibido > 0 && recibido < requerido;
  }).length;

  const itemsPendientes = items.filter((item) => {
    const requerido = item.cantidadAprobada ?? item.cantidadSolicitada;
    const recibido = cantidadesRecibidasPorItem[item.id] || 0;
    return recibido < requerido;
  });

  // Determinar estado general
  const recepcionCompleta = porcentajeRecibido >= 100;
  const hayRecepcionParcial = totalCantidadRecibida > 0 && totalCantidadRecibida < totalCantidadRequerida;

  const handleSelectLote = (lote: Lote) => {
    setSelectedLoteId(lote.id);
    const cantidades: Record<string, number> = {};
    lote.items.forEach((item) => {
      cantidades[item.id] = item.cantidadEnviada;
    });
    setCantidadesRecibidas(cantidades);
  };

  const handleConfirmRecepcion = async () => {
    if (!selectedLoteId) return;

    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch(`/api/lotes/${selectedLoteId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(cantidadesRecibidas).map(([loteItemId, cantidadRecibida]) => ({
            loteItemId,
            cantidadRecibida,
          })),
          observaciones: observaciones || undefined,
        }),
      });

      if (response.ok) {
        setSelectedLoteId(null);
        setCantidadesRecibidas({});
        setObservaciones("");
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al confirmar recepción");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!canConfirmDelivery) {
    return null;
  }

  if (estado !== "ENVIADO" && estado !== "ENTREGADO_PARCIAL") {
    return null;
  }

  if (lotesEnviados.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-purple-600" />
          Confirmación de Recepción
        </CardTitle>
        <CardDescription>
          Confirma la recepción de los lotes enviados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de Estado de Recepción */}
        <div className={`p-4 rounded-lg border-2 ${
          recepcionCompleta
            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
            : hayRecepcionParcial
              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
              : "bg-slate-50 dark:bg-slate-900/20 border-slate-300 dark:border-slate-700"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {recepcionCompleta ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : hayRecepcionParcial ? (
                <AlertTriangle className="h-5 w-5 text-purple-600" />
              ) : (
                <Clock className="h-5 w-5 text-slate-500" />
              )}
              <span className="font-semibold text-sm">
                {recepcionCompleta
                  ? "RECEPCIÓN COMPLETADA"
                  : hayRecepcionParcial
                    ? "RECEPCIÓN PARCIAL - PENDIENTE ENVÍO"
                    : "PENDIENTE DE RECEPCIÓN"}
              </span>
            </div>
            <Badge variant={recepcionCompleta ? "default" : hayRecepcionParcial ? "secondary" : "outline"}>
              {porcentajeRecibido}% recibido
            </Badge>
          </div>

          {/* Barra de progreso */}
          <Progress value={porcentajeRecibido} className="h-2 mb-3" />

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {itemsCompletamenteRecibidos}
              </div>
              <div className="text-xs text-muted-foreground">Items completos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {itemsParcialmenteRecibidos}
              </div>
              <div className="text-xs text-muted-foreground">Parciales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-500">
                {itemsPendientes.length - itemsParcialmenteRecibidos}
              </div>
              <div className="text-xs text-muted-foreground">Sin recibir</div>
            </div>
          </div>
        </div>

        {/* Items pendientes de recibir */}
        {itemsPendientes.length > 0 && !selectedLoteId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Items Pendientes de Recibir
              </h4>
              <span className="text-xs text-muted-foreground">
                {totalCantidadRequerida - totalCantidadRecibida} unidades restantes
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {itemsPendientes.map((item) => {
                const requerido = item.cantidadAprobada ?? item.cantidadSolicitada;
                const recibido = cantidadesRecibidasPorItem[item.id] || 0;
                const pendiente = requerido - recibido;
                const progreso = Math.round((recibido / requerido) * 100);

                return (
                  <div key={item.id} className="p-2 border rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.descripcion}</span>
                          {recibido > 0 && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              Parcial
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-x-2">
                          {item.numeroParte && <span>N° Parte: {item.numeroParte}</span>}
                          {item.marca && <span>Marca: {item.marca}</span>}
                          {item.modelo && <span>Modelo: {item.modelo}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-purple-600">
                          {pendiente} {item.unidadMedida?.abreviatura}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          pendiente
                        </div>
                      </div>
                    </div>
                    {recibido > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={progreso} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground w-10">{progreso}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {hayRecepcionParcial && lotesEnviados.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Esperando que Logística envíe los items restantes
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Lotes pendientes de recepción */}
        {!selectedLoteId && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Lotes Pendientes de Recepción</h4>
            {lotesEnviados.map((lote) => (
              <div
                key={lote.id}
                className="p-3 border rounded-lg bg-muted/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Lote #{lote.numero}</span>
                    {lote.fechaEnvio && (
                      <p className="text-xs text-muted-foreground">
                        Enviado: {new Date(lote.fechaEnvio).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleSelectLote(lote)}>
                    <PackageCheck className="h-4 w-4 mr-1" />
                    Confirmar Recepción
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {lote.items.length} items •{" "}
                  {lote.transportista && `Transportista: ${lote.transportista}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario de recepción */}
        {selectedLoteId && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium">Confirmar Recepción del Lote</h4>

            <div className="space-y-3">
              {lotes
                .find((l) => l.id === selectedLoteId)
                ?.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 border rounded"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.requerimientoItem.descripcion}
                      </p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {item.requerimientoItem.numeroParte && (
                          <span>Nº Parte: {item.requerimientoItem.numeroParte}</span>
                        )}
                        {item.requerimientoItem.modelo && (
                          <span>Modelo: {item.requerimientoItem.modelo}</span>
                        )}
                        <span>
                          Enviado: {item.cantidadEnviada}{" "}
                          {item.requerimientoItem.unidadMedida?.abreviatura}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Recibido:</Label>
                      <Input
                        type="number"
                        min={0}
                        max={item.cantidadEnviada}
                        value={cantidadesRecibidas[item.id] || 0}
                        onChange={(e) =>
                          setCantidadesRecibidas((prev) => ({
                            ...prev,
                            [item.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-20 h-8"
                      />
                    </div>
                    {cantidadesRecibidas[item.id] < item.cantidadEnviada && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Parcial
                      </Badge>
                    )}
                    {cantidadesRecibidas[item.id] === item.cantidadEnviada && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completo
                      </Badge>
                    )}
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs-recepcion">Observaciones</Label>
              <Textarea
                id="obs-recepcion"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas sobre la recepción (daños, faltantes, etc.)"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLoteId(null);
                  setCantidadesRecibidas({});
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmRecepcion}
                disabled={isConfirming}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Recepción
              </Button>
            </div>
          </div>
        )}

        {/* Lotes ya recibidos */}
        {lotesRecibidos.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-green-600">Lotes Recibidos</h4>
            {lotesRecibidos.map((lote) => (
              <div
                key={lote.id}
                className="p-3 border border-green-200 rounded-lg bg-green-50/50 dark:bg-green-900/10"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Lote #{lote.numero}</span>
                  {lote.fechaRecepcion && (
                    <span className="text-xs text-muted-foreground">
                      Recibido: {new Date(lote.fechaRecepcion).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
