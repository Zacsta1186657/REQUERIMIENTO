"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/requerimientos/status-badge";
import { Timeline } from "@/components/requerimientos/timeline";
import { LogisticaPanel } from "@/components/requerimientos/logistica-panel";
import { DespachoPanel } from "@/components/requerimientos/despacho-panel";
import { RecepcionPanel } from "@/components/requerimientos/recepcion-panel";
import { ArchivosRequerimiento } from "@/components/requerimientos/archivos-requerimiento";
import { useRequerimientosStore } from "@/stores/requerimientos-store";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABELS, UserRole } from "@/types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  MapPin,
  XCircle,
  Loader2,
  AlertCircle,
  Send,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TimelineEvent {
  id: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  comentario: string | null;
  fecha: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
  };
}

export default function RequerimientoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuthStore();
  const {
    currentRequerimiento: requerimiento,
    isLoading,
    error,
    fetchRequerimiento,
    submitRequerimiento,
    approveRequerimiento,
    rejectRequerimiento,
  } = useRequerimientosStore();

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [rejectComment, setRejectComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null);

  useEffect(() => {
    fetchRequerimiento(id);
    /*fetchTimeline();*/
  }, [id, fetchRequerimiento]);

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/requerimientos/${id}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActionError(null);
    const success = await submitRequerimiento(id);
    if (success) {
      await fetchTimeline();
    } else {
      setActionError("Error al enviar el requerimiento");
    }
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setActionError(null);
    const success = await approveRequerimiento(id);
    if (success) {
      await fetchTimeline();
    } else {
      setActionError("Error al aprobar el requerimiento");
    }
    setIsApproving(false);
  };

  const handleReject = async () => {
    if (rejectComment.trim().length < 10) {
      setActionError("El comentario debe tener al menos 10 caracteres");
      return;
    }
    setIsRejecting(true);
    setActionError(null);
    const success = await rejectRequerimiento(id, rejectComment);
    if (success) {
      setShowRejectForm(false);
      setRejectComment("");
      await fetchTimeline();
    } else {
      setActionError("Error al rechazar el requerimiento");
    }
    setIsRejecting(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/requerimientos/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comentario: newComment }),
      });
      if (response.ok) {
        setNewComment("");
        await fetchTimeline();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
    setIsAddingComment(false);
  };

  const handleEditItem = (itemId: string, currentQuantity: number) => {
    setEditingItemId(itemId);
    setEditingQuantity(currentQuantity);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingQuantity(0);
  };

  const handleSaveItem = async (itemId: string) => {
    if (editingQuantity <= 0) {
      setActionError("La cantidad debe ser mayor a 0");
      return;
    }
    setIsSavingItem(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/requerimientos/${id}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidadSolicitada: editingQuantity }),
      });
      if (response.ok) {
        setEditingItemId(null);
        setEditingQuantity(0);
        await fetchRequerimiento(id);
      } else {
        const data = await response.json();
        setActionError(data.error || "Error al actualizar el item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      setActionError("Error al actualizar el item");
    }
    setIsSavingItem(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("¿Estás seguro de eliminar este item?")) return;
    setIsDeletingItem(itemId);
    setActionError(null);
    try {
      const response = await fetch(`/api/requerimientos/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchRequerimiento(id);
      } else {
        const data = await response.json();
        setActionError(data.error || "Error al eliminar el item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setActionError("Error al eliminar el item");
    }
    setIsDeletingItem(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !requerimiento) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Requerimiento no encontrado</h2>
        <p className="text-muted-foreground mt-2">
          {error || "El requerimiento que buscas no existe"}
        </p>
        <Button asChild className="mt-4">
          <Link href="/requerimientos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Link>
        </Button>
      </div>
    );
  }

  const initials = requerimiento.solicitante.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  /*--- AGREGADO PARA QUE SOLO SEGURIDAD Y GESTION PUEDAN EDITAR Y ELIMINAR --- */
  const allowedRolesForItems = ["SEGURIDAD", "GERENCIA"];
  const hasRolePermission = allowedRolesForItems.includes(user?.rol || "");
  /*-------------------------------------------*/

  const permissions = requerimiento.permissions;
  const canSubmit = requerimiento.estado === "BORRADOR" && requerimiento.solicitante?.id === user?.id;
  const canApprove = permissions?.canApprove ?? false;
  const canReject = permissions?.canReject ?? false;
  const canEditItems = (permissions?.canEditItems ?? false) && hasRolePermission;
  const canDeleteItems = (permissions?.canDeleteItems ?? false) && hasRolePermission;
  const canMarkStock = permissions?.canMarkStock ?? false;
  const canCreateLote = permissions?.canCreateLote ?? false;
  const canDispatch = permissions?.canDispatch ?? false;
  const canConfirmDelivery = permissions?.canConfirmDelivery ?? false;

  // Convert items for display
  const displayItems = requerimiento.items?.map((item) => ({
    id: item.id,
    numeroParte: item.numeroParte || "",
    categoriaId: item.categoriaId,
    descripcion: item.descripcion,
    marca: item.marca || "",
    modelo: item.modelo || "",
    cantidadSolicitada: item.cantidadSolicitada,
    unidadMedidaId: item.unidadMedidaId,
    serial: item.serial || "",
  })) || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/requerimientos">Requerimientos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{requerimiento.numero}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {requerimiento.numero}
            </h1>
            <StatusBadge status={requerimiento.estado} />
          </div>
          <p className="text-muted-foreground">{requerimiento.motivo}</p>
        </div>

        {/* Actions based on role/status */}
        <div className="flex gap-2">
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          )}
          {canReject && !showRejectForm && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowRejectForm(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          )}
          {canApprove && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Aprobar
            </Button>
          )}
        </div>
      </div>

      {/* Reject form */}
      {showRejectForm && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600">Rechazar Requerimiento</CardTitle>
            <CardDescription>
              Proporcione un motivo para el rechazo (mínimo 10 caracteres)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Motivo del rechazo..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectComment("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || rejectComment.trim().length < 10}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Rechazo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="items" className="w-full">
            <TabsList>
              <TabsTrigger value="items">Items ({displayItems.length})</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Items del Requerimiento</CardTitle>
                  <CardDescription>
                    {displayItems.length} items solicitados
                    {(canEditItems || canDeleteItems) && (
                      <span className="ml-2 text-primary">
                        • Puedes {canEditItems && "editar"}{canEditItems && canDeleteItems && " y "}{canDeleteItems && "eliminar"} items
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displayItems.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left">Descripción</th>
                            <th className="p-2 text-left">Categoría</th>
                            <th className="p-2 text-center">Cantidad</th>
                            <th className="p-2 text-left">Unidad</th>
                            <th className="p-2 text-left">Marca</th>
                            {(canEditItems || canDeleteItems) && (
                              <th className="p-2 text-center">Acciones</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {requerimiento.items?.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2">{item.descripcion}</td>
                              <td className="p-2">{item.categoria?.nombre}</td>
                              <td className="p-2 text-center">
                                {editingItemId === item.id ? (
                                  <Input
                                    type="number"
                                    value={editingQuantity}
                                    onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 0)}
                                    className="w-20 h-8 text-center"
                                    min={1}
                                    autoFocus
                                  />
                                ) : (
                                  item.cantidadSolicitada
                                )}
                              </td>
                              <td className="p-2">{item.unidadMedida?.abreviatura}</td>
                              <td className="p-2">{item.marca || "-"}</td>
                              {(canEditItems || canDeleteItems) && (
                                <td className="p-2">
                                  <div className="flex items-center justify-center gap-1">
                                    {editingItemId === item.id ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-green-600 hover:text-green-700"
                                          onClick={() => handleSaveItem(item.id)}
                                          disabled={isSavingItem}
                                        >
                                          {isSavingItem ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Save className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={handleCancelEdit}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        {canEditItems && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleEditItem(item.id, item.cantidadSolicitada)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        )}
                                        {canDeleteItems && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteItem(item.id)}
                                            disabled={isDeletingItem === item.id}
                                          >
                                            {isDeletingItem === item.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay items en este requerimiento
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Estados</CardTitle>
                  <CardDescription>
                    Seguimiento de todas las actualizaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Timeline events={timeline} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comentarios" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comentarios</CardTitle>
                  <CardDescription>
                    Observaciones y notas del requerimiento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requerimiento.comentarios ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">{requerimiento.comentarios}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay comentarios adicionales
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Agregar comentario
                    </label>
                    <Textarea
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={isAddingComment || !newComment.trim()}
                    >
                      {isAddingComment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Enviar Comentario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">N° Requerimiento</p>
                  <p className="text-sm font-medium">{requerimiento.numero}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de Creación</p>
                  <p className="text-sm font-medium">
                    {formatDate(requerimiento.fecha)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Operación</p>
                  <p className="text-sm font-medium">
                    {requerimiento.operacion.codigo} - {requerimiento.operacion.nombre}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Centro de Costo</p>
                  <p className="text-sm font-medium">
                    {requerimiento.centroCosto.codigo} - {requerimiento.centroCosto.nombre}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solicitante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {requerimiento.solicitante.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[requerimiento.solicitante.rol as UserRole]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {requerimiento.solicitante.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentos adjuntos */}
          <ArchivosRequerimiento requerimientoId={id} />

          {/* Back button */}
          <Button asChild variant="outline" className="w-full">
            <Link href="/requerimientos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la lista
            </Link>
          </Button>
        </div>
      </div>

      {/* Workflow Panels - Full width section */}
      <div className="space-y-6">
        {/* Logistica Panel - Stock marking */}
        <LogisticaPanel
          requerimientoId={id}
          items={requerimiento.items?.map((item) => ({
            id: item.id,
            descripcion: item.descripcion,
            cantidadSolicitada: item.cantidadSolicitada,
            cantidadAprobada: item.cantidadAprobada ?? null,
            enStock: item.enStock ?? null,
            requiereCompra: item.requiereCompra ?? null,
            motivoStock: item.motivoStock ?? null,
            fechaEstimadaCompra: item.fechaEstimadaCompra ?? null,
            categoria: item.categoria ? { nombre: item.categoria.nombre } : undefined,
            unidadMedida: item.unidadMedida ? { abreviatura: item.unidadMedida.abreviatura } : undefined,
          })) || []}
          estado={requerimiento.estado}
          onUpdate={() => fetchRequerimiento(id)}
          canMarkStock={canMarkStock}
        />

        {/* Despacho Panel - Lot creation and dispatch */}
        <DespachoPanel
          requerimientoId={id}
          items={requerimiento.items?.map((item) => ({
            id: item.id,
            descripcion: item.descripcion,
            cantidadSolicitada: item.cantidadSolicitada,
            cantidadAprobada: item.cantidadAprobada ?? null,
            categoria: item.categoria ? { nombre: item.categoria.nombre } : undefined,
            unidadMedida: item.unidadMedida ? { abreviatura: item.unidadMedida.abreviatura } : undefined,
          })) || []}
          lotes={requerimiento.lotes?.map((lote) => ({
            id: lote.id,
            numero: lote.numero,
            estado: lote.estado,
            transportista: lote.transportista ?? null,
            destino: lote.destino ?? null,
            fechaEnvio: lote.fechaDespacho ?? null,
            items: lote.items?.map((loteItem) => ({
              id: loteItem.id,
              cantidadEnviada: loteItem.cantidadEnviada,
              requerimientoItem: loteItem.requerimientoItem ? {
                id: loteItem.requerimientoItem.id,
                descripcion: loteItem.requerimientoItem.descripcion,
                cantidadSolicitada: loteItem.requerimientoItem.cantidadSolicitada,
                cantidadAprobada: loteItem.requerimientoItem.cantidadAprobada ?? null,
              } : {
                id: "",
                descripcion: "",
                cantidadSolicitada: 0,
                cantidadAprobada: null,
              },
            })) || [],
          })) || []}
          estado={requerimiento.estado}
          onUpdate={() => fetchRequerimiento(id)}
          canCreateLote={canCreateLote}
          canDispatch={canDispatch}
        />

        {/* Recepcion Panel - Delivery confirmation */}
        <RecepcionPanel
          requerimientoId={id}
          lotes={requerimiento.lotes?.map((lote) => ({
            id: lote.id,
            numero: lote.numero,
            estado: lote.estado,
            transportista: lote.transportista ?? null,
            destino: lote.destino ?? null,
            fechaEnvio: lote.fechaDespacho ?? null,
            fechaRecepcion: lote.fechaEntrega ?? null,
            items: lote.items?.map((loteItem) => ({
              id: loteItem.id,
              cantidadEnviada: loteItem.cantidadEnviada,
              cantidadRecibida: loteItem.cantidadRecibida ?? null,
              requerimientoItem: loteItem.requerimientoItem ? {
                id: loteItem.requerimientoItem.id,
                descripcion: loteItem.requerimientoItem.descripcion,
                categoria: loteItem.requerimientoItem.categoria ? { nombre: loteItem.requerimientoItem.categoria.nombre } : undefined,
                unidadMedida: loteItem.requerimientoItem.unidadMedida ? { abreviatura: loteItem.requerimientoItem.unidadMedida.abreviatura } : undefined,
              } : {
                id: "",
                descripcion: "",
              },
            })) || [],
          })) || []}
          estado={requerimiento.estado}
          onUpdate={() => fetchRequerimiento(id)}
          canConfirmDelivery={canConfirmDelivery}
        />
      </div>
    </div>
  );
}
