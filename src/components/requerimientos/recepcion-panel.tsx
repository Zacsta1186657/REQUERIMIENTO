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
  CalendarClock,
  ClipboardCheck,
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
  fechaEstimadaLlegada: string | null;
  fechaEstimadaRecepcion: string | null;
  observacionRecepcion: string | null;
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
  // Estados para programar recojo (Paso 1)
  const [selectedLoteForSchedule, setSelectedLoteForSchedule] = useState<string | null>(null);
  const [fechaEstimadaRecepcion, setFechaEstimadaRecepcion] = useState("");
  const [observacionRecepcion, setObservacionRecepcion] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Estados para confirmar recepción (Paso 2)
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [cantidadesRecibidas, setCantidadesRecibidas] = useState<Record<string, number>>({});
  const [observaciones, setObservaciones] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Clasificar lotes por estado
  // Lotes recién despachados - necesitan programar recojo (Paso 1)
  const lotesPendientesSchedule = lotes.filter(
    (lote) => lote.estado === "DESPACHADO" || lote.estado === "EN_TRANSITO"
  );

  // Lotes con recojo programado - pendientes de confirmar recepción (Paso 2)
  const lotesPendientesRecepcion = lotes.filter(
    (lote) => lote.estado === "PENDIENTE_RECEPCION"
  );

  // Lotes ya recibidos
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

  // Paso 1: Programar recojo
  const handleSchedulePickup = async () => {
    if (!selectedLoteForSchedule) return;

    if (!fechaEstimadaRecepcion) {
      setError("La fecha estimada de recojo es obligatoria");
      return;
    }

    if (!observacionRecepcion || observacionRecepcion.trim().length < 10) {
      setError("La observación debe tener al menos 10 caracteres");
      return;
    }

    setIsScheduling(true);
    setError(null);

    try {
      const response = await fetch(`/api/lotes/${selectedLoteForSchedule}/schedule-pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaEstimadaRecepcion,
          observacionRecepcion,
        }),
      });

      if (response.ok) {
        setSelectedLoteForSchedule(null);
        setFechaEstimadaRecepcion("");
        setObservacionRecepcion("");
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al programar el recojo");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsScheduling(false);
    }
  };

  // Paso 2: Seleccionar lote para confirmar recepción
  const handleSelectLote = (lote: Lote) => {
    setSelectedLoteId(lote.id);
    const cantidades: Record<string, number> = {};
    lote.items.forEach((item) => {
      cantidades[item.id] = item.cantidadEnviada;
    });
    setCantidadesRecibidas(cantidades);
  };

  // Paso 2: Confirmar recepción final
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

  // IMPORTANTE: Mostrar el panel si hay lotes despachados, sin importar el estado del requerimiento
  const hayLotesParaMostrar = lotesPendientesSchedule.length > 0 ||
    lotesPendientesRecepcion.length > 0 ||
    lotesRecibidos.length > 0;

  if (!hayLotesParaMostrar) {
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
          Programa el recojo y confirma la recepción de los lotes enviados
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
        {itemsPendientes.length > 0 && !selectedLoteId && !selectedLoteForSchedule && (
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
          </div>
        )}

        <Separator />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ============================================== */}
        {/* PASO 1: Lotes pendientes de programar recojo  */}
        {/* ============================================== */}
        {lotesPendientesSchedule.length > 0 && !selectedLoteId && !selectedLoteForSchedule && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-amber-600" />
              <h4 className="font-medium text-sm">Paso 1: Programar Recojo</h4>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {lotesPendientesSchedule.length} pendiente{lotesPendientesSchedule.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Antes de confirmar la recepción, debe indicar cuándo planea recoger el producto.
            </p>
            {lotesPendientesSchedule.map((lote) => (
              <div
                key={lote.id}
                className="p-3 border-2 border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Lote #{lote.numero}</span>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      {lote.fechaEnvio && (
                        <p>Enviado: {new Date(lote.fechaEnvio).toLocaleDateString("es-ES")}</p>
                      )}
                      {lote.fechaEstimadaLlegada && (
                        <p className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Llegada estimada: {new Date(lote.fechaEstimadaLlegada).toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500 text-amber-700 hover:bg-amber-100"
                    onClick={() => setSelectedLoteForSchedule(lote.id)}
                  >
                    <CalendarClock className="h-4 w-4 mr-1" />
                    Programar Recojo
                  </Button>
                </div>
                {/* Detalle de productos del lote */}
                <div className="space-y-1 p-2 bg-white dark:bg-slate-800 rounded border">
                  <p className="text-xs font-semibold text-muted-foreground">Productos:</p>
                  {lote.items.slice(0, 3).map((item) => (
                    <p key={item.id} className="text-xs">
                      • {item.requerimientoItem.descripcion} ({item.cantidadEnviada} {item.requerimientoItem.unidadMedida?.abreviatura})
                    </p>
                  ))}
                  {lote.items.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      ... y {lote.items.length - 3} producto{lote.items.length - 3 > 1 ? 's' : ''} más
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lote.items.length} items • {lote.items.reduce((sum, i) => sum + i.cantidadEnviada, 0)} unidades •{" "}
                  {lote.transportista && `Transportista: ${lote.transportista}`}
                  {lote.destino && ` • Destino: ${lote.destino}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para programar recojo (Paso 1) */}
        {selectedLoteForSchedule && (
          <div className="space-y-4 p-4 border-2 border-amber-300 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-amber-600" />
              <h4 className="font-medium">Programar Recojo del Lote #{lotes.find(l => l.id === selectedLoteForSchedule)?.numero}</h4>
            </div>

            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-sm text-amber-800 dark:text-amber-300">
              <p className="font-medium mb-1">Importante:</p>
              <p>Debe indicar la fecha en que planea recoger el producto y una observación con detalles adicionales. Esta información es obligatoria antes de poder confirmar la recepción.</p>
            </div>

            {/* Información del lote (solo lectura) */}
            {(() => {
              const lote = lotes.find(l => l.id === selectedLoteForSchedule);
              if (!lote) return null;
              return (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                  <h5 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Información del Lote
                  </h5>

                  {/* Fecha estimada de llegada */}
                  {lote.fechaEstimadaLlegada && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded border-l-4 border-blue-400">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Fecha estimada de llegada (asignada por Logística):
                      </p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {new Date(lote.fechaEstimadaLlegada).toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  )}

                  {/* Detalle de productos */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Productos incluidos en este lote:
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {lote.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border text-sm">
                          <div className="flex-1">
                            <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                            <span className="font-medium">{item.requerimientoItem.descripcion}</span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {item.cantidadEnviada} {item.requerimientoItem.unidadMedida?.abreviatura}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      Total: {lote.items.length} producto{lote.items.length > 1 ? 's' : ''} •
                      {lote.items.reduce((sum, i) => sum + i.cantidadEnviada, 0)} unidades
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha-recojo" className="flex items-center gap-1">
                  Fecha Estimada de Recojo
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha-recojo"
                  type="date"
                  value={fechaEstimadaRecepcion}
                  onChange={(e) => setFechaEstimadaRecepcion(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="max-w-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-recojo" className="flex items-center gap-1">
                  Observación
                  <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground font-normal">(mín. 10 caracteres)</span>
                </Label>
                <Textarea
                  id="obs-recojo"
                  value={observacionRecepcion}
                  onChange={(e) => setObservacionRecepcion(e.target.value)}
                  placeholder="Indique cuándo planea recoger el producto, horario preferido, o cualquier comentario relevante..."
                  rows={3}
                  className={observacionRecepcion.length > 0 && observacionRecepcion.length < 10 ? "border-red-300" : ""}
                />
                {observacionRecepcion.length > 0 && observacionRecepcion.length < 10 && (
                  <p className="text-xs text-red-600">
                    Faltan {10 - observacionRecepcion.length} caracteres
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLoteForSchedule(null);
                  setFechaEstimadaRecepcion("");
                  setObservacionRecepcion("");
                  setError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSchedulePickup}
                disabled={isScheduling || !fechaEstimadaRecepcion || observacionRecepcion.length < 10}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isScheduling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4 mr-2" />
                )}
                Confirmar Fecha de Recojo
              </Button>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* PASO 2: Lotes pendientes de confirmar recepción */}
        {/* ============================================== */}
        {lotesPendientesRecepcion.length > 0 && !selectedLoteId && !selectedLoteForSchedule && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-sm">Paso 2: Confirmar Recepción</h4>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {lotesPendientesRecepcion.length} listo{lotesPendientesRecepcion.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Estos lotes ya tienen fecha de recojo programada. Confirme la recepción cuando haya recibido los productos.
            </p>
            {lotesPendientesRecepcion.map((lote) => (
              <div
                key={lote.id}
                className="p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Lote #{lote.numero}</span>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      {lote.fechaEstimadaLlegada && (
                        <p className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Clock className="h-3 w-3" />
                          Llegada estimada: {new Date(lote.fechaEstimadaLlegada).toLocaleDateString("es-ES")}
                        </p>
                      )}
                      {lote.fechaEstimadaRecepcion && (
                        <p className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          Recojo programado: {new Date(lote.fechaEstimadaRecepcion).toLocaleDateString("es-ES")}
                        </p>
                      )}
                      {lote.observacionRecepcion && (
                        <p className="italic">"{lote.observacionRecepcion}"</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSelectLote(lote)}
                  >
                    <PackageCheck className="h-4 w-4 mr-1" />
                    Confirmar Recepción
                  </Button>
                </div>
                {/* Detalle de productos del lote */}
                <div className="space-y-1 p-2 bg-white dark:bg-slate-800 rounded border">
                  <p className="text-xs font-semibold text-muted-foreground">Productos:</p>
                  {lote.items.slice(0, 3).map((item) => (
                    <p key={item.id} className="text-xs">
                      • {item.requerimientoItem.descripcion} ({item.cantidadEnviada} {item.requerimientoItem.unidadMedida?.abreviatura})
                    </p>
                  ))}
                  {lote.items.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      ... y {lote.items.length - 3} producto{lote.items.length - 3 > 1 ? 's' : ''} más
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lote.items.length} items • {lote.items.reduce((sum, i) => sum + i.cantidadEnviada, 0)} unidades •{" "}
                  {lote.transportista && `Transportista: ${lote.transportista}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario de recepción final (Paso 2) */}
        {selectedLoteId && (
          <div className="space-y-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Confirmar Recepción del Lote #{lotes.find(l => l.id === selectedLoteId)?.numero}</h4>
            </div>

            {/* Mostrar fecha estimada vs fecha actual */}
            {(() => {
              const lote = lotes.find(l => l.id === selectedLoteId);
              if (lote?.fechaEstimadaRecepcion) {
                const fechaEstimada = new Date(lote.fechaEstimadaRecepcion);
                const fechaActual = new Date();
                const diferenciaDias = Math.ceil((fechaActual.getTime() - fechaEstimada.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div className={`p-2 rounded text-sm ${
                    diferenciaDias > 0
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  }`}>
                    <p>
                      Fecha de recojo programada: {fechaEstimada.toLocaleDateString("es-ES")}
                      {diferenciaDias > 0 && (
                        <span className="font-semibold ml-2">({diferenciaDias} día{diferenciaDias > 1 ? 's' : ''} de retraso)</span>
                      )}
                      {diferenciaDias === 0 && (
                        <span className="font-semibold ml-2">(Hoy)</span>
                      )}
                      {diferenciaDias < 0 && (
                        <span className="font-semibold ml-2">(Anticipado {Math.abs(diferenciaDias)} día{Math.abs(diferenciaDias) > 1 ? 's' : ''})</span>
                      )}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Información del lote (solo lectura) */}
            {(() => {
              const lote = lotes.find(l => l.id === selectedLoteId);
              if (!lote) return null;
              return (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                  <h5 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Detalle del Lote a Recibir
                  </h5>

                  {/* Fecha estimada de llegada */}
                  {lote.fechaEstimadaLlegada && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded border-l-4 border-blue-400">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Fecha estimada de llegada (asignada por Logística):
                      </p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {new Date(lote.fechaEstimadaLlegada).toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  )}

                  {/* Detalle de productos (informativo) */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Productos que va a confirmar:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {lote.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border text-sm">
                          <div className="flex-1">
                            <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                            <span className="font-medium">{item.requerimientoItem.descripcion}</span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {item.cantidadEnviada} {item.requerimientoItem.unidadMedida?.abreviatura}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      Total: {lote.items.length} producto{lote.items.length > 1 ? 's' : ''} •
                      {lote.items.reduce((sum, i) => sum + i.cantidadEnviada, 0)} unidades a recibir
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Formulario de cantidades recibidas */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Confirmar Cantidades Recibidas</h5>
              <p className="text-xs text-muted-foreground">
                Indique la cantidad exacta que recibió de cada producto. Si recibió menos de lo enviado, se marcará como parcial.
              </p>
            </div>

            <div className="space-y-3">
              {lotes
                .find((l) => l.id === selectedLoteId)
                ?.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 border rounded bg-white dark:bg-slate-900"
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
              <Label htmlFor="obs-recepcion">Observaciones de la Recepción (opcional)</Label>
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
                  setObservaciones("");
                  setError(null);
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
                Confirmar Recepción Final
              </Button>
            </div>
          </div>
        )}

        {/* Lotes ya recibidos */}
        {lotesRecibidos.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Lotes Recibidos
            </h4>
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
                      Recibido: {new Date(lote.fechaRecepcion).toLocaleDateString("es-ES")}
                    </span>
                  )}
                </div>
                {lote.fechaEstimadaRecepcion && lote.fechaRecepcion && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const fechaEstimada = new Date(lote.fechaEstimadaRecepcion);
                      const fechaReal = new Date(lote.fechaRecepcion);
                      const diferenciaDias = Math.ceil((fechaReal.getTime() - fechaEstimada.getTime()) / (1000 * 60 * 60 * 24));

                      if (diferenciaDias > 0) {
                        return <span className="text-amber-600">Recepción con {diferenciaDias} día{diferenciaDias > 1 ? 's' : ''} de retraso</span>;
                      } else if (diferenciaDias < 0) {
                        return <span className="text-green-600">Recepción anticipada {Math.abs(diferenciaDias)} día{Math.abs(diferenciaDias) > 1 ? 's' : ''}</span>;
                      } else {
                        return <span className="text-green-600">Recepción a tiempo</span>;
                      }
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mensaje informativo si hay lotes esperando envío */}
        {hayRecepcionParcial && lotesPendientesSchedule.length === 0 && lotesPendientesRecepcion.length === 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Esperando que Logística envíe los items restantes
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
