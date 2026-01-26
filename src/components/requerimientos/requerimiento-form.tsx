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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCatalogosStore } from "@/stores/catalogos-store";
import { useAuthStore } from "@/stores/auth-store";
import { useRequerimientosStore } from "@/stores/requerimientos-store";
import { FormItem } from "./item-form";
import { Save, Send, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ItemForm } from "./item-form";

interface RequerimientoFormProps {
  requerimientoId?: string;
}

export function RequerimientoForm({ requerimientoId }: RequerimientoFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { operaciones, centrosCosto, isLoading: catalogosLoading, fetchCatalogos } = useCatalogosStore();
  const { createRequerimiento, fetchRequerimiento, currentRequerimiento, submitRequerimiento } = useRequerimientosStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<FormItem[]>([]);
  const [formData, setFormData] = useState({
    operacionId: "",
    centroCostoId: "",
    motivo: "",
    comentarios: "",
  });

  useEffect(() => {
    fetchCatalogos();
  }, [fetchCatalogos]);

  useEffect(() => {
    if (requerimientoId) {
      fetchRequerimiento(requerimientoId);
    }
  }, [requerimientoId, fetchRequerimiento]);

  useEffect(() => {
    if (currentRequerimiento && requerimientoId) {
      setFormData({
        operacionId: currentRequerimiento.operacion.id,
        centroCostoId: currentRequerimiento.centroCosto.id,
        motivo: currentRequerimiento.motivo,
        comentarios: currentRequerimiento.comentarios || "",
      });
      // Load existing items if editing
      if (currentRequerimiento.items) {
        setItems(currentRequerimiento.items.map((item) => ({
          id: item.id,
          categoriaId: item.categoriaId,
          unidadMedidaId: item.unidadMedidaId,
          descripcion: item.descripcion,
          cantidadSolicitada: item.cantidadSolicitada,
          numeroParte: item.numeroParte || "",
          marca: item.marca || "",
          modelo: item.modelo || "",
          serial: item.serial || "",
        })));
      }
    }
  }, [currentRequerimiento, requerimientoId]);

  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await createRequerimiento({
        operacionId: formData.operacionId,
        centroCostoId: formData.centroCostoId,
        motivo: formData.motivo,
        comentarios: formData.comentarios || undefined,
      });

      if (result) {
        // Save items
        for (const item of items) {
          await fetch(`/api/requerimientos/${result.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...item,
              numeroParte: item.numeroParte || null,
              marca: item.marca || null,
              modelo: item.modelo || null,
              serial: item.serial || null,
            }),
          });
        }
        router.push(`/requerimientos/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // First create the draft
      const result = await createRequerimiento({
        operacionId: formData.operacionId,
        centroCostoId: formData.centroCostoId,
        motivo: formData.motivo,
        comentarios: formData.comentarios || undefined,
      });

      if (!result) {
        throw new Error("Error al crear el requerimiento");
      }

      // Save items
      for (const item of items) {
        await fetch(`/api/requerimientos/${result.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            numeroParte: item.numeroParte || null,
            marca: item.marca || null,
            modelo: item.modelo || null,
            serial: item.serial || null,
          }),
        });
      }

      // Submit the requerimiento
      const submitted = await submitRequerimiento(result.id);
      if (submitted) {
        router.push(`/requerimientos/${result.id}`);
      } else {
        throw new Error("Error al enviar el requerimiento");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (catalogosLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Requerimiento</CardTitle>
          <CardDescription>
            Complete los datos generales del requerimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Read-only fields */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" value={today} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitante">Solicitante</Label>
              <Input
                id="solicitante"
                value={user?.nombre || ""}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Editable fields */}
            <div className="space-y-2">
              <Label htmlFor="operacion">Operación *</Label>
              <Select
                value={formData.operacionId}
                onValueChange={(v) => setFormData({ ...formData, operacionId: v })}
                required
              >
                <SelectTrigger id="operacion">
                  <SelectValue placeholder="Seleccione la operación" />
                </SelectTrigger>
                <SelectContent>
                  {operaciones.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.codigo} - {op.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="centroCosto">Centro de Costo *</Label>
              <Select
                value={formData.centroCostoId}
                onValueChange={(v) =>
                  setFormData({ ...formData, centroCostoId: v })
                }
                required
              >
                <SelectTrigger id="centroCosto">
                  <SelectValue placeholder="Seleccione el centro de costo" />
                </SelectTrigger>
                <SelectContent>
                  {centrosCosto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.codigo} - {cc.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo del Requerimiento *</Label>
              <Textarea
                id="motivo"
                placeholder="Describa el motivo del requerimiento..."
                value={formData.motivo}
                onChange={(e) =>
                  setFormData({ ...formData, motivo: e.target.value })
                }
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentarios Adicionales</Label>
              <Textarea
                id="comentarios"
                placeholder="Comentarios opcionales..."
                value={formData.comentarios}
                onChange={(e) =>
                  setFormData({ ...formData, comentarios: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Items del Requerimiento</CardTitle>
          <CardDescription>
            Agregue los items que desea solicitar. Complete la descripción y
            datos de cada item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/requerimientos")}
          disabled={isSubmitting || isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveDraft}
          disabled={isSubmitting || isSaving || !formData.operacionId || !formData.centroCostoId || !formData.motivo}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Borrador
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            isSaving ||
            !formData.operacionId ||
            !formData.centroCostoId ||
            !formData.motivo ||
            items.length === 0
          }
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? "Enviando..." : "Enviar Requerimiento"}
        </Button>
      </div>
    </form>
  );
}
