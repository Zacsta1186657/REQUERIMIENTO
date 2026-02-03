"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABELS, UserRole } from "@/types";
import { Plus, Pencil, Trash2, Shield, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Roles that can manage users (solo ADMIN puede crear usuarios)
const ADMIN_ROLES: UserRole[] = ["ADMIN"];

// Available roles for registration
const availableRoles: UserRole[] = [
  "TECNICO",
  "SEGURIDAD",
  "OPERACIONES",
  "GERENCIA",
  "LOGISTICA",
  "ADMINISTRACION",
  "RECEPTOR",
  "ADMIN",
];

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  operacion?: {
    id: string;
    nombre: string;
    codigo: string;
  } | null;
  _count?: {
    requerimientos: number;
  };
}

interface Operacion {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, active: 0 });
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const itemsPerPage = 10;

  // Fix hydration mismatch with Radix UI Select
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch operaciones
  const fetchOperaciones = async () => {
    try {
      const response = await fetch("/api/catalogos/operaciones");
      if (response.ok) {
        const data = await response.json();
        setOperaciones(data.data?.filter((op: Operacion) => op.activo) || []);
      }
    } catch (error) {
      console.error("Error fetching operaciones:", error);
    }
  };

  useEffect(() => {
    fetchOperaciones();
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "" as UserRole | "",
    operacionId: "",
    password: "",
    confirmPassword: "",
  });

  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    rol: "" as UserRole | "",
    operacionId: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);

        // Fetch all users for stats
        const statsResponse = await fetch("/api/users?limit=1000");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const userList = statsData.data || [];
          setStats({
            total: userList.length,
            admins: userList.filter((u: User) => ADMIN_ROLES.includes(u.rol)).length,
            active: userList.filter((u: User) => u.activo).length,
          });
        }
      } else if (response.status === 403) {
        // Not authorized
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  // Check if current user has admin privileges
  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.rol);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Acceso Denegado</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          No tienes permisos para acceder a esta sección.
          Solo los administradores pueden gestionar usuarios.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/")}
        >
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          operacionId: formData.operacionId || null,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setFormData({
          nombre: "",
          email: "",
          rol: "",
          operacionId: "",
          password: "",
          confirmPassword: "",
        });
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Error al crear usuario");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Error al eliminar usuario");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      nombre: user.nombre,
      rol: user.rol,
      operacionId: user.operacion?.id || "",
    });
    setEditError(null);
  };

  const handleCloseEditDialog = () => {
    setEditingUser(null);
    setEditFormData({ nombre: "", rol: "", operacionId: "" });
    setEditError(null);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsEditing(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editFormData.nombre,
          rol: editFormData.rol,
          operacionId: editFormData.operacionId || null,
        }),
      });

      if (response.ok) {
        handleCloseEditDialog();
        await fetchUsers();
      } else {
        const data = await response.json();
        setEditError(data.error || "Error al actualizar usuario");
      }
    } catch (err) {
      setEditError("Error de conexión");
    } finally {
      setIsEditing(false);
    }
  };

  const getRoleBadgeVariant = (rol: UserRole) => {
    switch (rol) {
      case "ADMIN":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "ADMINISTRACION":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "GERENCIA":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "SEGURIDAD":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "OPERACIONES":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "LOGISTICA":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema
          </p>
        </div>

        <Button asChild>
          <Link href="/usuarios/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Usuario</CardTitle>
          <CardDescription>
            Complete los datos para crear una nueva cuenta de usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                {mounted ? (
                  <Select
                    value={formData.rol}
                    onValueChange={(v) => setFormData({ ...formData, rol: v as UserRole })}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Skeleton className="h-10 w-full" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="operacion">Operación</Label>
                {mounted ? (
                  <Select
                    value={formData.operacionId}
                    onValueChange={(v) => setFormData({ ...formData, operacionId: v })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una operación" />
                    </SelectTrigger>
                    <SelectContent>
                      {operaciones.map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.codigo} - {op.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Skeleton className="h-10 w-full" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">usuarios registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">con permisos de admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">cuentas activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Todos los usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const initials = user.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.nombre}</span>
                              {ADMIN_ROLES.includes(user.rol) && (
                                <Shield className="h-4 w-4 text-purple-500" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeVariant(user.rol)}
                          >
                            {ROLE_LABELS[user.rol]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.operacion ? (
                            <span className="text-sm">
                              {user.operacion.codigo} - {user.operacion.nombre}
                            </span>
                          ) : (
                            <span className="text-xs italic">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.activo ? "default" : "secondary"}>
                            {user.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={user.id === currentUser?.id}
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && handleCloseEditDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Los cambios se guardarán inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre Completo</Label>
                <Input
                  id="edit-nombre"
                  value={editFormData.nombre}
                  onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                  required
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rol">Rol</Label>
                {mounted ? (
                  <Select
                    value={editFormData.rol}
                    onValueChange={(v) => setEditFormData({ ...editFormData, rol: v as UserRole })}
                    disabled={isEditing || editingUser?.id === currentUser?.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Skeleton className="h-10 w-full" />
                )}
                {editingUser?.id === currentUser?.id && (
                  <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-operacion">Operación</Label>
                {mounted ? (
                  <Select
                    value={editFormData.operacionId || "none"}
                    onValueChange={(v) => setEditFormData({ ...editFormData, operacionId: v === "none" ? "" : v })}
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin operación asignada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin operación</SelectItem>
                      {operaciones.map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.codigo} - {op.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Skeleton className="h-10 w-full" />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditDialog}
                disabled={isEditing}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
