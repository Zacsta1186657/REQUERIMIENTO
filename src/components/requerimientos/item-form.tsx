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
import { useCatalogosStore } from "@/stores/catalogos-store";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

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

interface ItemFormProps {
  items: FormItem[];
  onChange: (items: FormItem[]) => void;
  readOnly?: boolean;
}

export function ItemForm({ items, onChange, readOnly = false }: ItemFormProps) {
  const { categorias, unidadesMedida, fetchCatalogos, isLoaded } = useCatalogosStore();

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

  const handleAddItem = () => {
    if (!newItem.descripcion.trim() || !newItem.categoriaId || !newItem.unidadMedidaId) return;

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

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormItem, value: string | number) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
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
              <TableRow key={item.id}>
                <TableCell>
                  {readOnly ? (
                    item.numeroParte || "-"
                  ) : (
                    <Input
                      value={item.numeroParte || ""}
                      onChange={(e) =>
                        handleItemChange(item.id, "numeroParte", e.target.value)
                      }
                      className="h-8"
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
                      <SelectTrigger className="h-8">
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
                      className="h-8"
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
                      className="h-8"
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
                      className="h-8"
                      placeholder="Modelo"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    item.cantidadSolicitada
                  ) : (
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidadSolicitada}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          "cantidadSolicitada",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-8 w-20"
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
                      <SelectTrigger className="h-8">
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
                      className="h-8"
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
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
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
                    onChange={(e) =>
                      setNewItem({ ...newItem, numeroParte: e.target.value })
                    }
                    className="h-8"
                    placeholder="NP-000"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newItem.categoriaId}
                    onValueChange={(v) =>
                      setNewItem({ ...newItem, categoriaId: v })
                    }
                  >
                    <SelectTrigger className="h-8">
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
                    onChange={(e) =>
                      setNewItem({ ...newItem, descripcion: e.target.value })
                    }
                    className="h-8"
                    placeholder="Descripción del item *"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.marca || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, marca: e.target.value })
                    }
                    className="h-8"
                    placeholder="Marca"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newItem.modelo || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, modelo: e.target.value })
                    }
                    className="h-8"
                    placeholder="Modelo"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.cantidadSolicitada}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        cantidadSolicitada: parseInt(e.target.value) || 1,
                      })
                    }
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newItem.unidadMedidaId}
                    onValueChange={(v) =>
                      setNewItem({ ...newItem, unidadMedidaId: v })
                    }
                  >
                    <SelectTrigger className="h-8">
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
                    onChange={(e) =>
                      setNewItem({ ...newItem, serial: e.target.value })
                    }
                    className="h-8"
                    placeholder="Serial"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary"
                    onClick={handleAddItem}
                    disabled={!newItem.descripcion.trim() || !newItem.categoriaId || !newItem.unidadMedidaId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Agrega al menos un item al requerimiento
        </p>
      )}
    </div>
  );
}
