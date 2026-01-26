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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABELS } from "@/types";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();
  const { user, fetchUser } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    nombre: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre,
        email: user.email,
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setProfileSuccess("Perfil actualizado correctamente");
        fetchUser();
      } else {
        const data = await response.json();
        setProfileError(data.error || "Error al actualizar perfil");
      }
    } catch {
      setProfileError("Error de conexión");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      if (response.ok) {
        setPasswordSuccess("Contraseña actualizada correctamente");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await response.json();
        setPasswordError(data.error || "Error al cambiar contraseña");
      }
    } catch {
      setPasswordError("Error de conexión");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const initials = user.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias del sistema
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Tu información personal en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" disabled>
                Cambiar foto
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG o GIF. Máximo 2MB.
              </p>
            </div>
          </div>

          <Separator />

          {profileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
          )}
          {profileSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{profileSuccess}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={profileData.nombre}
                  onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Input
                  id="rol"
                  value={ROLE_LABELS[user.rol]}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>
            Personaliza la apariencia de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme" className="w-[200px]">
                <SelectValue placeholder="Selecciona un tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona el tema de color para la interfaz
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Gestiona la seguridad de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          {passwordSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{passwordSuccess}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cambiar contraseña
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
