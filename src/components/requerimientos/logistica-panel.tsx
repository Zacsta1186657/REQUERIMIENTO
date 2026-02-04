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
  Upload,
  FileText,
  X,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, formatFileSize } from "@/lib/file-constants";
import { ITEM_STATUS_CONFIG, type ItemStatus } from "@/lib/workflow/item-transitions";

interface Item {
  id: string;
  descripcion: string;
  numeroParte: string | null;
  marca: string | null;
  modelo: string | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  estadoItem: ItemStatus;
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

interface ItemClassification {
  clasificacion: 'stock' | 'compra' | null;
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
  // Filtrar solo ítems pendientes de clasificación
  const itemsPendientes = items.filter(
    (item) => item.estadoItem === 'PENDIENTE_CLASIFICACION'
  );

  // Estado local para las clasificaciones
  const [classifications, setClassifications] = useState<Record<string, ItemClassification>>(() => {
    const initial: Record<string, ItemClassification> = {};
    itemsPendientes.forEach((item) => {
      initial[item.id] = {
        clasificacion: null,
        cantidadAprobada: item.cantidadAprobada ?? item.cantidadSolicitada,
        motivoStock: item.motivoStock || "",
        fechaEstimadaCompra: item.fechaEstimadaCompra || "",
      };
    });
    return initial;
  });

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

  const handleClassificationChange = (itemId: string, clasificacion: 'stock' | 'compra' | null) => {
    setClassifications((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        clasificacion,
      },
    }));
  };

  const handleFieldChange = (itemId: string, field: keyof ItemClassification, value: string | number) => {
    setClassifications((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleProcess = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validar que todos los ítems estén clasificados
      const itemsSinClasificar = Object.entries(classifications).filter(
        ([, c]) => c.clasificacion === null
      );

      if (itemsSinClasificar.length > 0) {
        setError(`Hay ${itemsSinClasificar.length} ítem(s) sin clasificar`);
        setIsProcessing(false);
        return;
      }

      // Subir archivos primero
      const filesUploaded = await uploadFiles();
      if (!filesUploaded) {
        setIsProcessing(false);
        return;
      }

      // Preparar datos para el endpoint
      const itemsData = Object.entries(classifications).map(([itemId, c]) => ({
        itemId,
        nuevoEstado: c.clasificacion === 'stock' ? 'EN_STOCK' : 'REQUIERE_COMPRA',
        cantidadAprobada: c.cantidadAprobada,
        motivoStock: c.motivoStock || null,
        fechaEstimadaCompra: c.fechaEstimadaCompra || null,
      }));

      // Llamar al endpoint para clasificar ítems
      const response = await fetch(`/api/requerimientos/${requerimientoId}/items/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsData }),
      });

      if (response.ok) {
        setFilesToUpload([]);
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || "Error al procesar clasificación");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calcular resumen
  const itemsEnStock = Object.values(classifications).filter((c) => c.clasificacion === 'stock').length;
  const itemsCompra = Object.values(classifications).filter((c) => c.clasificacion === 'compra').length;
  const itemsSinClasificar = Object.values(classifications).filter((c) => c.clasificacion === null).length;

  // No mostrar si no hay permisos o no hay ítems pendientes
  if (!canMarkStock) {
    return null;
  }

  // Mostrar resumen si no hay ítems pendientes pero hay ítems en otros estados
  if (itemsPendientes.length === 0) {
    const itemsYaClasificados = items.filter(
      (item) => item.estadoItem !== 'PENDIENTE_CLASIFICACION'
    );

    if (itemsYaClasificados.length === 0 || estado !== "REVISION_LOGISTICA") {
      return null;
    }

    // Mostrar resumen de ítems ya clasificados
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Revisión de Logística
          </CardTitle>
          <CardDescription>
            Todos los ítems han sido clasificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{item.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.cantidadAprobada || item.cantidadSolicitada} {item.unidadMedida?.abreviatura}
                  </p>
                </div>
                <Badge className={`${ITEM_STATUS_CONFIG[item.estadoItem].bgColor} ${ITEM_STATUS_CONFIG[item.estadoItem].color}`}>
                  {ITEM_STATUS_CONFIG[item.estadoItem].label}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Revisión de Logística
        </CardTitle>
        <CardDescription>
          Clasifica cada ítem según disponibilidad de stock. El estado de cada ítem se manejará de forma independiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Resumen */}
        <div className="flex flex-wrap gap-3">
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
              <AlertCircle className="h-3 w-3 mr-1" />
              Sin clasificar: {itemsSinClasificar}
            </Badge>
          )}
        </div>

        {/* Lista de items pendientes */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Ítems Pendientes de Clasificación
            <Badge variant="secondary">{itemsPendientes.length}</Badge>
          </h4>

          {itemsPendientes.map((item) => {
            const classification = classifications[item.id];
            return (
              <div
                key={item.id}
                className={`p-4 border rounded-lg space-y-3 transition-colors ${
                  classification?.clasificacion === 'stock'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : classification?.clasificacion === 'compra'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300'
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.descripcion}</p>
                    <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                      {item.numeroParte && <span>Nº Parte: {item.numeroParte}</span>}
                      {item.marca && <span>Marca: {item.marca}</span>}
                      {item.modelo && <span>Modelo: {item.modelo}</span>}
                      <span>{item.categoria?.nombre}</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {item.cantidadSolicitada} {item.unidadMedida?.abreviatura}
                  </Badge>
                </div>

                {/* Clasificación con Radio buttons visuales */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Clasificación</Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleClassificationChange(item.id, 'stock')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        classification?.clasificacion === 'stock'
                          ? 'border-green-500 bg-green-100 dark:bg-green-900/40'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Package className={`h-5 w-5 ${
                          classification?.clasificacion === 'stock' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          classification?.clasificacion === 'stock' ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          En Stock
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClassificationChange(item.id, 'compra')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        classification?.clasificacion === 'compra'
                          ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/40'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ShoppingCart className={`h-5 w-5 ${
                          classification?.clasificacion === 'compra' ? 'text-orange-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          classification?.clasificacion === 'compra' ? 'text-orange-700' : 'text-gray-600'
                        }`}>
                          Requiere Compra
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Campos adicionales si requiere compra */}
                {classification?.clasificacion === 'compra' && (
                  <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor={`fecha-${item.id}`} className="text-xs">
                        Fecha Estimada de Compra
                      </Label>
                      <Input
                        id={`fecha-${item.id}`}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={classification.fechaEstimadaCompra}
                        onChange={(e) =>
                          handleFieldChange(item.id, "fechaEstimadaCompra", e.target.value)
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`motivo-${item.id}`} className="text-xs">
                        Observaciones / Proveedor
                      </Label>
                      <Input
                        id={`motivo-${item.id}`}
                        value={classification.motivoStock}
                        onChange={(e) =>
                          handleFieldChange(item.id, "motivoStock", e.target.value)
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

        {/* Botón de procesar */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleProcess}
            disabled={isProcessing || itemsSinClasificar > 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {itemsSinClasificar > 0
              ? `Clasificar todos los ítems (${itemsSinClasificar} pendiente${itemsSinClasificar > 1 ? 's' : ''})`
              : `Procesar ${itemsPendientes.length} ítem${itemsPendientes.length > 1 ? 's' : ''}`
            }
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Los ítems en stock pasarán a "Listo para Despacho". Los de compra pasarán a "Pendiente Validación Admin".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
