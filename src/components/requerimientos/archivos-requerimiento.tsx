"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Loader2,
  FileImage,
  FileSpreadsheet,
  File,
  Paperclip,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatFileSize } from "@/lib/file-constants";

interface Archivo {
  id: string;
  nombre: string;
  tipo: string;
  mimeType: string;
  tamanio: number;
  extension: string;
  descripcion: string | null;
  createdAt: string;
  subidoPor: {
    id: string;
    nombre: string;
  };
}

interface ArchivosRequerimientoProps {
  requerimientoId: string;
}

const TIPO_LABELS: Record<string, string> = {
  FACTURA: "Factura",
  GUIA_REMISION: "Guía de Remisión",
  ORDEN_COMPRA: "Orden de Compra",
  COTIZACION: "Cotización",
  DOCUMENTO_GENERAL: "Documento General",
  OTRO: "Otro",
};

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <FileImage className="h-4 w-4 text-green-600" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  }
  if (["pdf"].includes(ext)) {
    return <FileText className="h-4 w-4 text-red-600" />;
  }
  if (["doc", "docx"].includes(ext)) {
    return <FileText className="h-4 w-4 text-blue-600" />;
  }
  return <File className="h-4 w-4 text-gray-600" />;
}

export function ArchivosRequerimiento({
  requerimientoId,
}: ArchivosRequerimientoProps) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchArchivos();
  }, [requerimientoId]);

  const fetchArchivos = async () => {
    try {
      const response = await fetch(
        `/api/archivos?requerimientoId=${requerimientoId}`
      );
      if (response.ok) {
        const data = await response.json();
        setArchivos(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching archivos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (archivo: Archivo) => {
    setDownloadingId(archivo.id);
    try {
      const response = await fetch(`/api/archivos/${archivo.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = archivo.nombre;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (archivos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-5 w-5 text-blue-600" />
          Documentos Adjuntos
        </CardTitle>
        <CardDescription>
          {archivos.length} archivo{archivos.length !== 1 ? "s" : ""} adjunto
          {archivos.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {archivos.map((archivo) => (
            <div
              key={archivo.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getFileIcon(archivo.extension)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{archivo.nombre}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {TIPO_LABELS[archivo.tipo] || archivo.tipo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(archivo.tamanio)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(archivo.createdAt)}
                    </span>
                  </div>
                  {archivo.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {archivo.descripcion}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleDownload(archivo)}
                disabled={downloadingId === archivo.id}
              >
                {downloadingId === archivo.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
