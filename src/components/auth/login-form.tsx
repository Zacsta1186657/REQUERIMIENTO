"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { Package, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Error al iniciar sesión");
        return;
      }

      setUser(result.user);
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form (50%) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white dark:bg-slate-950">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Iniciar Sesión
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Correo Electrónico<span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                disabled={isSubmitting}
                className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Contraseña<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  disabled={isSubmitting}
                  className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500 pr-12"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            ¿No tienes acceso?{" "}
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Contacta al administrador
            </span>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative Panel (50%) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f2e] via-[#1e2a4a] to-[#1a1f2e] animate-gradient-shift" />

        {/* Animated Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.3),_transparent_50%)] animate-pulse-slow" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.2),_transparent_50%)] animate-pulse-slower" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Shape 1 - Large square */}
          <div className="absolute top-[15%] right-[15%] w-24 h-24 border border-white/10 rounded-xl animate-float-slow" />

          {/* Shape 2 - Medium filled square */}
          <div className="absolute top-[25%] right-[25%] w-16 h-16 bg-white/5 rounded-lg animate-float-medium backdrop-blur-sm" />

          {/* Shape 3 - Small circle */}
          <div className="absolute top-[10%] left-[20%] w-8 h-8 bg-blue-500/20 rounded-full animate-float-fast" />

          {/* Shape 4 - Large circle outline */}
          <div className="absolute bottom-[20%] left-[10%] w-32 h-32 border border-white/10 rounded-full animate-float-slower" />

          {/* Shape 5 - Medium square */}
          <div className="absolute bottom-[30%] left-[20%] w-12 h-12 bg-indigo-500/10 rounded-lg animate-float-medium" />

          {/* Shape 6 - Small square */}
          <div className="absolute bottom-[15%] right-[20%] w-10 h-10 border border-blue-400/20 rounded animate-float-fast" />

          {/* Shape 7 - Tiny dot */}
          <div className="absolute top-[40%] left-[15%] w-4 h-4 bg-blue-400/30 rounded-full animate-pulse-slow" />

          {/* Shape 8 - Medium circle */}
          <div className="absolute top-[60%] right-[10%] w-20 h-20 border border-indigo-400/10 rounded-full animate-float-slow" />
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slower" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow" />

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo with glow effect */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-xl animate-pulse-slow" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Package className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Sistema de Requerimientos
          </h2>

          {/* Description */}
          <p className="text-slate-400 text-center max-w-sm leading-relaxed">
            Gestión integral de requerimientos de almacén para tu empresa.
            Control de inventario, solicitudes y entregas en un solo lugar.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <span className="px-4 py-2 bg-white/5 backdrop-blur-sm text-slate-300 text-sm rounded-full border border-white/10 hover:bg-white/10 transition-colors">
              Control de Stock
            </span>
            <span className="px-4 py-2 bg-white/5 backdrop-blur-sm text-slate-300 text-sm rounded-full border border-white/10 hover:bg-white/10 transition-colors">
              Aprobaciones
            </span>
            <span className="px-4 py-2 bg-white/5 backdrop-blur-sm text-slate-300 text-sm rounded-full border border-white/10 hover:bg-white/10 transition-colors">
              Despachos
            </span>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1f2e] to-transparent" />
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-3deg);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(3deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 10s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
