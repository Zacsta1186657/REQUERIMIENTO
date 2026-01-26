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
import {
  PackageCheck,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

interface LoteItem {
  id: string;
  cantidadEnviada: number;
  cantidadRecibida: number | null;
  requerimientoItem: {
    id: string;
    descripcion: string;
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

interface RecepcionPanelProps {
  requerimientoId: string;
  lotes: Lote[];
  estado: string;
  onUpdate: () => void;
  canConfirmDelivery: boolean;
}

export function RecepcionPanel({
  requerimientoId,
  lotes = [],
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
                      <p className="text-xs text-muted-foreground">
                        Enviado: {item.cantidadEnviada}{" "}
                        {item.requerimientoItem.unidadMedida?.abreviatura}
                      </p>
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
