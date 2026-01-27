"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useCatalogosStore } from "@/stores/catalogos-store";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

// Local UI type for form items
export interface FormItem {
  id: string;
  numeroParte?: string;
  categoriaId: string;
  descripcion: string;
  marca?: string;
  modelo?: string;
  cantidadSolicitada: number;
  unidadMedidaId: string;
  serial?: string;
}

export interface ItemValidationError {
  itemIndex: number;
  fields: string[];
  fieldLabels: string[];
}

export interface ItemFormRef {
  getPendingItem: () => Omit<FormItem, "id"> | null;
  addPendingItemIfValid: () => boolean;
  hasIncompleteData: () => boolean;
  getValidationErrors: () => string[];
  showValidationErrors: () => void;
  clearPendingItem: () => void;
  validateAllItems: () => { isValid: boolean; errors: ItemValidationError[] };
  showItemErrors: () => void;
  clearAllErrors: () => void;
}

interface ItemFormProps {
  items: FormItem[];
  onChange: (items: FormItem[]) => void;
  readOnly?: boolean;
}

export const ItemForm = forwardRef<ItemFormRef, ItemFormProps>(function ItemForm({ items, onChange, readOnly = false }, ref) {
  const { categorias, unidadesMedida, fetchCatalogos, isLoaded } = useCatalogosStore();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newItemErrors, setNewItemErrors] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  // Errores de items existentes: Map<itemId, Set<fieldName>>
  const [itemErrors, setItemErrors] = useState<Map<string, Set<string>>>(new Map());
  const [itemErrorMessages, setItemErrorMessages] = useState<ItemValidationError[]>([]);

  useEffect(() => {
    if (!isLoaded) {
      fetchCatalogos();
    }
  }, [isLoaded, fetchCatalogos]);

  const defaultCategoriaId = categorias[0]?.id || "";
  const defaultUnidadId = unidadesMedida.find((u) => u.abreviatura === "UND")?.id || unidadesMedida[0]?.id || "";

  const [newItem, setNewItem] = useState<Omit<FormItem, "id">>({
    numeroParte: "",
    categoriaId: defaultCategoriaId,
    descripcion: "",
    marca: "",
    modelo: "",
    cantidadSolicitada: 1,
    unidadMedidaId: defaultUnidadId,
    serial: "",
  });

  // Update defaults when catalogs load
  useEffect(() => {
    if (categorias.length > 0 && !newItem.categoriaId) {
      setNewItem((prev) => ({ ...prev, categoriaId: categorias[0].id }));
    }
    if (unidadesMedida.length > 0 && !newItem.unidadMedidaId) {
      const undUnit = unidadesMedida.find((u) => u.abreviatura === "UND");
      setNewItem((prev) => ({ ...prev, unidadMedidaId: undUnit?.id || unidadesMedida[0].id }));
    }
  }, [categorias, unidadesMedida, newItem.categoriaId, newItem.unidadMedidaId]);

  const getCategoriaLabel = (id: string) => {
    return categorias.find((c) => c.id === id)?.nombre || id;
  };

  const getUnidadLabel = (id: string) => {
    return unidadesMedida.find((u) => u.id === id)?.abreviatura || id;
  };

  // Verificar si el nuevo item tiene algún dato ingresado (cualquier campo modificado)
  const hasAnyData = () => {
    return !!(
      newItem.numeroParte?.trim() ||
      newItem.descripcion.trim() ||
      newItem.marca?.trim() ||
      newItem.modelo?.trim() ||
      newItem.serial?.trim()
    );
  };

  // Validar campos requeridos del nuevo item (TODOS los campos son obligatorios)
  const validateNewItem = (): { errors: string[]; fields: string[] } => {
    const errors: string[] = [];
    const fields: string[] = [];

    if (!newItem.numeroParte?.trim()) {
      errors.push("N° Parte");
      fields.push("numeroParte");
    }
    if (!newItem.categoriaId) {
      errors.push("Categoría");
      fields.push("categoriaId");
    }
    if (!newItem.descripcion.trim()) {
      errors.push("Descripción");
      fields.push("descripcion");
    }
    if (!newItem.marca?.trim()) {
      errors.push("Marca");
      fields.push("marca");
    }
    if (!newItem.modelo?.trim()) {
      errors.push("Modelo");
      fields.push("modelo");
    }
    if (!newItem.cantidadSolicitada || newItem.cantidadSolicitada < 1) {
      errors.push("Cantidad (debe ser mayor a 0)");
      fields.push("cantidadSolicitada");
    }
    if (!newItem.unidadMedidaId) {
      errors.push("Unidad");
      fields.push("unidadMedidaId");
    }
    if (!newItem.serial?.trim()) {
      errors.push("Serial");
      fields.push("serial");
    }

    return { errors, fields };
  };

  // Validar un item existente (TODOS los campos son obligatorios)
  const validateItem = (item: FormItem): { fields: string[]; fieldLabels: string[] } => {
    const fields: string[] = [];
    const fieldLabels: string[] = [];

    if (!item.numeroParte?.trim()) {
      fields.push("numeroParte");
      fieldLabels.push("N° Parte");
    }
    if (!item.categoriaId) {
      fields.push("categoriaId");
      fieldLabels.push("Categoría");
    }
    if (!item.descripcion.trim()) {
      fields.push("descripcion");
      fieldLabels.push("Descripción");
    }
    if (!item.marca?.trim()) {
      fields.push("marca");
      fieldLabels.push("Marca");
    }
    if (!item.modelo?.trim()) {
      fields.push("modelo");
      fieldLabels.push("Modelo");
    }
    if (!item.cantidadSolicitada || item.cantidadSolicitada < 1) {
      fields.push("cantidadSolicitada");
      fieldLabels.push("Cantidad");
    }
    if (!item.unidadMedidaId) {
      fields.push("unidadMedidaId");
      fieldLabels.push("Unidad");
    }
    if (!item.serial?.trim()) {
      fields.push("serial");
      fieldLabels.push("Serial");
    }

    return { fields, fieldLabels };
  };

  // Validar todos los items existentes
  const validateAllItems = (): { isValid: boolean; errors: ItemValidationError[] } => {
    const errors: ItemValidationError[] = [];
    const newItemErrors = new Map<string, Set<string>>();

    items.forEach((item, index) => {
      const { fields, fieldLabels } = validateItem(item);
      if (fields.length > 0) {
        errors.push({
          itemIndex: index + 1,
          fields,
          fieldLabels,
        });
        newItemErrors.set(item.id, new Set(fields));
      }
    });

    setItemErrors(newItemErrors);
    setItemErrorMessages(errors);

    return { isValid: errors.length === 0, errors };
  };

  // Verificar si un campo de un item tiene error
  const hasItemFieldError = (itemId: string, field: string): boolean => {
    return itemErrors.get(itemId)?.has(field) || false;
  };

  // Limpiar error de un campo específico de un item
  const clearItemFieldError = (itemId: string, field: string) => {
    const itemFieldErrors = itemErrors.get(itemId);
    if (itemFieldErrors?.has(field)) {
      const newFieldErrors = new Set(itemFieldErrors);
      newFieldErrors.delete(field);
      const newItemErrors = new Map(itemErrors);
      if (newFieldErrors.size === 0) {
        newItemErrors.delete(itemId);
      } else {
        newItemErrors.set(itemId, newFieldErrors);
      }
      setItemErrors(newItemErrors);
      // Actualizar mensajes de error
      setItemErrorMessages(prev => {
        const updated = prev.map(err => {
          const item = items.find((i, idx) => idx + 1 === err.itemIndex);
          if (item?.id === itemId) {
            const newFields = err.fields.filter(f => f !== field);
            const newLabels = err.fieldLabels.filter((_, i) => err.fields[i] !== field);
            return { ...err, fields: newFields, fieldLabels: newLabels };
          }
          return err;
        }).filter(err => err.fields.length > 0);
        return updated;
      });
    }
  };

  const handleAddItem = () => {
    const { errors, fields } = validateNewItem();

    if (errors.length > 0) {
      setNewItemErrors(errors);
      setErrorFields(new Set(fields));
      return;
    }

    setNewItemErrors([]);
    setErrorFields(new Set());
    const item: FormItem = {
      ...newItem,
      id: `temp-${Date.now()}`,
    };

    onChange([...items, item]);
    setNewItem({
      numeroParte: "",
      categoriaId: categorias[0]?.id || "",
      descripcion: "",
      marca: "",
      modelo: "",
      cantidadSolicitada: 1,
      unidadMedidaId: unidadesMedida.find((u) => u.abreviatura === "UND")?.id || unidadesMedida[0]?.id || "",
      serial: "",
    });
  };

  const clearNewItem = () => {
    setNewItem({
      numeroParte: "",
      categoriaId: categorias[0]?.id || "",
      descripcion: "",
      marca: "",
      modelo: "",
      cantidadSolicitada: 1,
      unidadMedidaId: unidadesMedida.find((u) => u.abreviatura === "UND")?.id || unidadesMedida[0]?.id || "",
      serial: "",
    });
    setNewItemErrors([]);
    setErrorFields(new Set());
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
    setItemToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
  };

  // Exponer métodos al padre
  useImperativeHandle(ref, () => ({
    getPendingItem: () => {
      const { errors } = validateNewItem();
      if (errors.length === 0) {
        return newItem;
      }
      return null;
    },
    addPendingItemIfValid: () => {
      const { errors, fields } = validateNewItem();
      if (errors.length === 0) {
        handleAddItem();
        return true;
      }
      // Si hay datos pero está incompleto, mostrar errores
      if (hasAnyData()) {
        setNewItemErrors(errors);
        setErrorFields(new Set(fields));
      }
      return false;
    },
    hasIncompleteData: () => {
      return hasAnyData() && validateNewItem().errors.length > 0;
    },
    getValidationErrors: () => {
      if (hasAnyData()) {
        return validateNewItem().errors;
      }
      return [];
    },
    showValidationErrors: () => {
      if (hasAnyData()) {
        const { errors, fields } = validateNewItem();
        setNewItemErrors(errors);
        setErrorFields(new Set(fields));
      }
    },
    clearPendingItem: () => {
      clearNewItem();
    },
    validateAllItems: () => {
      return validateAllItems();
    },
    showItemErrors: () => {
      validateAllItems();
    },
    clearAllErrors: () => {
      setItemErrors(new Map());
      setItemErrorMessages([]);
      setNewItemErrors([]);
      setErrorFields(new Set());
    },
  }));

  const handleItemChange = (id: string, field: keyof FormItem, value: string | number) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    // Limpiar error del campo si existe
    clearItemFieldError(id, field);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">N° Parte</TableHead>
              <TableHead className="w-[120px]">Categoría</TableHead>
              <TableHead className="min-w-[200px]">Descripción</TableHead>
              <TableHead className="w-[100px]">Marca</TableHead>
              <TableHead className="w-[100px]">Modelo</TableHead>
              <TableHead className="w-[80px]">Cantidad</TableHead>
              <TableHead className="w-[100px]">Unidad</TableHead>
              <TableHead className="w-[100px]">Serial</TableHead>
              {!readOnly && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={itemErrors.has(item.id) ? "bg-destructive/5" : ""}>
                <TableCell>
                  {readOnly ? (
                    item.numeroParte || "-"
                  ) : (
                    <Input
                      value={item.numeroParte || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "numeroParte", e.target.value)
                      }
                      className={`h-8 ${hasItemFieldError(item.id, "numeroParte") ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="NP-000"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    getCategoriaLabel(item.categoriaId)
                  ) : (
                    <Select
                      value={item.categoriaId}
                      onValueChange={(v) =>
                        handleItemChange(item.id, "categoriaId", v)
                      }
                    >
                      <SelectTrigger className={`h-8 ${hasItemFieldError(item.id, "categoriaId") ? "border-destructive ring-1 ring-destructive" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.descripcion
                  ) : (
                    <Input
                      value={item.descripcion}
                      onChange={(e) =>
                        handleItemChange(item.id, "descripcion", e.target.value)
                      }
                      className={`h-8 ${hasItemFieldError(item.id, "descripcion") ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="Descripción del item"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.marca || "-"
                  ) : (
                    <Input
                      value={item.marca || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "marca", e.target.value)
                      }
                      className={`h-8 ${hasItemFieldError(item.id, "marca") ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="Marca"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.modelo || "-"
                  ) : (
                    <Input
                      value={item.modelo || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "modelo", e.target.value)
                      }
                      className={`h-8 ${hasItemFieldError(item.id, "modelo") ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="Modelo"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.cantidadSolicitada
                  ) : (
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.cantidadSolicitada}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleItemChange(
                          item.id,
                          "cantidadSolicitada",
                          parseInt(value) || 0
                        );
                      }}
                      className={`h-8 w-20 ${hasItemFieldError(item.id, "cantidadSolicitada") ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="0"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    getUnidadLabel(item.unidadMedidaId)
                  ) : (
                    <Select
                      value={item.unidadMedidaId}
                      onValueChange={(v) =>
                        handleItemChange(item.id, "unidadMedidaId", v)
                      }
                    >
                      <SelectTrigger className={`h-8 ${hasItemFieldError(item.id, "unidadMedidaId") ? "border-destructive ring-1 ring-destructive" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesMedida.map((unidad) => (
                          <SelectItem key={unidad.id} value={unidad.id}>
                            {unidad.abreviatura}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.serial || "-"
                  ) : (
                    <Input
                      value={item.serial || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "serial", e.target.value)
                      }
                      className={`h-8 ${hasItemFieldError(item.id, "serial") ? "border-destructive ring-1 ring-destructive" : ""}`}
                      placeholder="Serial"
                    />
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => confirmDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {/* New item row */}
            {!readOnly && (
              <TableRow className="bg-muted/30">
                <TableCell>
                  <Input
                    value={newItem.numeroParte || ""}
                    onChange={(e) => {
                      setNewItem({ ...newItem, numeroParte: e.target.value });
                      if (errorFields.has("numeroParte")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("numeroParte");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(err => err !== "N° Parte"));
                      }
                    }}
                    className={`h-8 ${errorFields.has("numeroParte") ? "border-destructive ring-destructive" : ""}`}
                    placeholder="NP-000"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newItem.categoriaId}
                    onValueChange={(v) => {
                      setNewItem({ ...newItem, categoriaId: v });
                      if (errorFields.has("categoriaId")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("categoriaId");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(e => e !== "Categoría"));
                      }
                    }}
                  >
                    <SelectTrigger className={`h-8 ${errorFields.has("categoriaId") ? "border-destructive ring-destructive" : ""}`}>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.descripcion}
                    onChange={(e) => {
                      setNewItem({ ...newItem, descripcion: e.target.value });
                      if (errorFields.has("descripcion")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("descripcion");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(err => err !== "Descripción"));
                      }
                    }}
                    className={`h-8 ${errorFields.has("descripcion") ? "border-destructive ring-destructive" : ""}`}
                    placeholder="Descripción del item"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.marca || ""}
                    onChange={(e) => {
                      setNewItem({ ...newItem, marca: e.target.value });
                      if (errorFields.has("marca")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("marca");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(err => err !== "Marca"));
                      }
                    }}
                    className={`h-8 ${errorFields.has("marca") ? "border-destructive ring-destructive" : ""}`}
                    placeholder="Marca"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.modelo || ""}
                    onChange={(e) => {
                      setNewItem({ ...newItem, modelo: e.target.value });
                      if (errorFields.has("modelo")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("modelo");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(err => err !== "Modelo"));
                      }
                    }}
                    className={`h-8 ${errorFields.has("modelo") ? "border-destructive ring-destructive" : ""}`}
                    placeholder="Modelo"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newItem.cantidadSolicitada || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setNewItem({
                        ...newItem,
                        cantidadSolicitada: parseInt(value) || 0,
                      });
                      if (errorFields.has("cantidadSolicitada")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("cantidadSolicitada");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(err => !err.includes("Cantidad")));
                      }
                    }}
                    className={`h-8 w-20 ${errorFields.has("cantidadSolicitada") ? "border-destructive ring-destructive" : ""}`}
                    placeholder="1"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newItem.unidadMedidaId}
                    onValueChange={(v) => {
                      setNewItem({ ...newItem, unidadMedidaId: v });
                      if (errorFields.has("unidadMedidaId")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("unidadMedidaId");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(e => e !== "Unidad"));
                      }
                    }}
                  >
                    <SelectTrigger className={`h-8 ${errorFields.has("unidadMedidaId") ? "border-destructive ring-destructive" : ""}`}>
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.id}>
                          {unidad.abreviatura}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.serial || ""}
                    onChange={(e) => {
                      setNewItem({ ...newItem, serial: e.target.value });
                      if (errorFields.has("serial")) {
                        const newErrors = new Set(errorFields);
                        newErrors.delete("serial");
                        setErrorFields(newErrors);
                        setNewItemErrors(prev => prev.filter(err => err !== "Serial"));
                      }
                    }}
                    className={`h-8 ${errorFields.has("serial") ? "border-destructive ring-destructive" : ""}`}
                    placeholder="Serial"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary cursor-pointer"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && itemErrorMessages.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <p className="text-sm font-medium text-destructive">
            Hay items con campos incompletos:
          </p>
          <ul className="text-sm text-destructive list-disc list-inside mt-1">
            {itemErrorMessages.map((error, idx) => (
              <li key={idx}>
                Item #{error.itemIndex}: Falta completar {error.fieldLabels.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && newItemErrors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <p className="text-sm font-medium text-destructive">
            Campos requeridos faltantes en el nuevo item:
          </p>
          <ul className="text-sm text-destructive list-disc list-inside mt-1">
            {newItemErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {!readOnly && items.length === 0 && newItemErrors.length === 0 && itemErrorMessages.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Agrega al menos un item al requerimiento
        </p>
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar este item del requerimiento? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => itemToDelete && handleRemoveItem(itemToDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
