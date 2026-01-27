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
import { Send, AlertCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ItemForm, ItemFormRef } from "./item-form";

interface RequerimientoFormProps {
  requerimientoId?: string;
}

export function RequerimientoForm({ requerimientoId }: RequerimientoFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { operaciones, centrosCosto, isLoading: catalogosLoading, fetchCatalogos } = useCatalogosStore();
  const { createRequerimiento, fetchRequerimiento, currentRequerimiento, submitRequerimiento } = useRequerimientosStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [items, setItems] = useState<FormItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const itemFormRef = useRef<ItemFormRef>(null);
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

  const validateForm = (itemsToValidate: FormItem[]): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.operacionId) {
      errors.operacion = "Debe seleccionar una operación";
    }
    if (!formData.centroCostoId) {
      errors.centroCosto = "Debe seleccionar un centro de costo";
    }
    if (!formData.motivo.trim()) {
      errors.motivo = "Debe ingresar el motivo del requerimiento";
    }
    if (itemsToValidate.length === 0) {
      errors.items = "Debe agregar al menos un item al requerimiento";
    }

    // Validar items
    const invalidItems = itemsToValidate.filter(item => !item.descripcion.trim() || !item.categoriaId || !item.unidadMedidaId || item.cantidadSolicitada < 1);
    if (invalidItems.length > 0) {
      errors.items = "Algunos items tienen datos incompletos (descripción, categoría, unidad o cantidad)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (itemFormRef.current) {
      // Limpiar errores previos
      itemFormRef.current.clearAllErrors();

      // Primero validar los items existentes
      const { isValid: itemsValid } = itemFormRef.current.validateAllItems();

      if (!itemsValid) {
        setError("Hay items con campos incompletos. Por favor, complete todos los campos requeridos.");
        return;
      }

      // Verificar si hay un item incompleto en la fila de nuevo item
      if (itemFormRef.current.hasIncompleteData()) {
        // Mostrar los errores visualmente (bordes rojos)
        itemFormRef.current.showValidationErrors();
        setError("Hay un item incompleto en la fila de nuevo item. Complete todos los campos requeridos o elimine los datos parciales antes de enviar.");
        return;
      }

      // Si el item pendiente está completo, agregarlo automáticamente
      const pendingItem = itemFormRef.current.getPendingItem();
      if (pendingItem) {
        const newItem: FormItem = {
          ...pendingItem,
          id: `temp-${Date.now()}`,
        };
        const finalItems = [...items, newItem];
        setItems(finalItems);
        // Limpiar el item pendiente después de agregarlo
        itemFormRef.current.clearPendingItem();

        if (!validateForm(finalItems)) {
          setError("Por favor, corrija los errores en el formulario");
          return;
        }

        setShowConfirmDialog(true);
        return;
      }
    }

    if (!validateForm(items)) {
      setError("Por favor, corrija los errores en el formulario");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
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
    <>
    <form onSubmit={handleSubmitClick} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {Object.keys(fieldErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {Object.values(fieldErrors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
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
          <ItemForm ref={itemFormRef} items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => router.push("/requerimientos")}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={isSubmitting}
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

    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro que desea enviar este requerimiento? Una vez enviado, no podrá modificarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="cursor-pointer" onClick={handleConfirmSubmit}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
