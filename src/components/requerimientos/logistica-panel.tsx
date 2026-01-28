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
  Upload,
  FileText,
  X,
  Paperclip,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, formatFileSize } from "@/lib/file-constants";

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

interface FileToUpload {
  file: File;
  tipo: string;
  descripcion: string;
}

const TIPO_ARCHIVO_OPTIONS = [
  { value: "FACTURA", label: "Factura" },
  { value: "GUIA_REMISION", label: "Guía de Remisión" },
  { value: "ORDEN_COMPRA", label: "Orden de Compra" },
  { value: "COTIZACION", label: "Cotización" },
  { value: "DOCUMENTO_GENERAL", label: "Documento General" },
  { value: "OTRO", label: "Otro" },
];

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

  // File upload state
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles: FileToUpload[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`${file.name}: Tipo de archivo no permitido`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Archivo muy grande (máx. ${formatFileSize(MAX_FILE_SIZE)})`);
        return;
      }

      validFiles.push({
        file,
        tipo: "DOCUMENTO_GENERAL",
        descripcion: "",
      });
    });

    if (errors.length > 0) {
      setError(errors.join(". "));
    }

    setFilesToUpload((prev) => [...prev, ...validFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileType = (index: number, tipo: string) => {
    setFilesToUpload((prev) =>
      prev.map((f, i) => (i === index ? { ...f, tipo } : f))
    );
  };

  const updateFileDescription = (index: number, descripcion: string) => {
    setFilesToUpload((prev) =>
      prev.map((f, i) => (i === index ? { ...f, descripcion } : f))
    );
  };

  const uploadFiles = async (): Promise<boolean> => {
    if (filesToUpload.length === 0) return true;

    try {
      for (const fileData of filesToUpload) {
        const formData = new FormData();
        formData.append("file", fileData.file);
        formData.append("tipo", fileData.tipo);
        formData.append("requerimientoId", requerimientoId);
        if (fileData.descripcion) {
          formData.append("descripcion", fileData.descripcion);
        }

        const response = await fetch("/api/archivos", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al subir archivo");
        }
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivos");
      return false;
    }
  };

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

      // Subir archivos si hay
      const filesUploaded = await uploadFiles();
      if (!filesUploaded) {
        setIsProcessing(false);
        return;
      }

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
        setFilesToUpload([]); // Clear uploaded files
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

        {/* Adjuntar documentos */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium">Adjuntar Documentos</h4>
            <span className="text-xs text-muted-foreground">(Opcional)</span>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra archivos aquí o{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                selecciona archivos
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG - Máx. {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>

          {/* Lista de archivos a subir */}
          {filesToUpload.length > 0 && (
            <div className="space-y-3">
              {filesToUpload.map((fileData, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {fileData.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(fileData.file.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">Tipo de documento</Label>
                      <Select
                        value={fileData.tipo}
                        onValueChange={(value) => updateFileType(index, value)}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_ARCHIVO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Descripción (opcional)</Label>
                      <Input
                        className="h-8 mt-1"
                        placeholder="Descripción del documento..."
                        value={fileData.descripcion}
                        onChange={(e) => updateFileDescription(index, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
