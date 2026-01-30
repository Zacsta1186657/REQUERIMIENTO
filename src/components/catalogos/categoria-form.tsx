'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCategoriaSchema } from '@/lib/validations/categoria';

type FormData = {
  nombre: string;
  activo?: boolean;
};

interface CategoriaFormProps {
  id?: string;
}

export function CategoriaForm({ id }: CategoriaFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createCategoriaSchema),
    defaultValues: {
      nombre: '',
      activo: true,
    },
  });

  const activo = watch('activo');

  useEffect(() => {
    if (id) {
      fetchCategoria();
    }
  }, [id]);

  const fetchCategoria = async () => {
    try {
      const response = await fetch(`/api/catalogos/categorias/${id}`);
      if (response.ok) {
        const categoria = await response.json();
        setValue('nombre', categoria.nombre);
        setValue('activo', categoria.activo);
      }
    } catch (error) {
      console.error('Error fetching categoria:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEdit
        ? `/api/catalogos/categorias/${id}`
        : '/api/catalogos/categorias';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: isEdit ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
        });
        router.push('/catalogos');
      } else {
        setError(result.error || 'Error al guardar la categoría');
      }
    } catch (error) {
      console.error('Error saving categoria:', error);
      setError('Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          {...register('nombre')}
          placeholder="Ej: EPP, Herramientas, Equipos"
          disabled={loading}
        />
        {errors.nombre && (
          <p className="text-sm text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="activo"
          checked={activo}
          onCheckedChange={(checked) => setValue('activo', checked)}
          disabled={loading}
        />
        <Label htmlFor="activo">Activo</Label>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/catalogos')}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
