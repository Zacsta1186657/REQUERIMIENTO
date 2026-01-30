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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createModeloSchema } from '@/lib/validations/modelo';
import { useCatalogosStore } from '@/stores/catalogos-store';

type FormData = {
  nombre: string;
  marcaId: string;
  activo?: boolean;
};

interface ModeloFormProps {
  id?: string;
}

export function ModeloForm({ id }: ModeloFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!id;

  const { marcas, fetchMarcas } = useCatalogosStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createModeloSchema),
    defaultValues: {
      nombre: '',
      marcaId: '',
      activo: true,
    },
  });

  const activo = watch('activo');
  const marcaId = watch('marcaId');

  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]);

  useEffect(() => {
    if (id) {
      fetchModelo();
    }
  }, [id]);

  const fetchModelo = async () => {
    try {
      const response = await fetch(`/api/catalogos/modelos/${id}`);
      if (response.ok) {
        const modelo = await response.json();
        setValue('nombre', modelo.nombre);
        setValue('marcaId', modelo.marcaId);
        setValue('activo', modelo.activo);
      }
    } catch (error) {
      console.error('Error fetching modelo:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const url = isEdit
        ? `/api/catalogos/modelos/${id}`
        : '/api/catalogos/modelos';
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
          description: isEdit ? 'Modelo actualizado exitosamente' : 'Modelo creado exitosamente',
        });
        router.push('/catalogos');
      } else {
        setError(result.error || 'Error al guardar el modelo');
      }
    } catch (error) {
      console.error('Error saving modelo:', error);
      setError('Error al guardar el modelo');
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
        <Label htmlFor="marcaId">Marca *</Label>
        <Select value={marcaId} onValueChange={(value) => setValue('marcaId', value)}>
          <SelectTrigger id="marcaId">
            <SelectValue placeholder="Selecciona una marca" />
          </SelectTrigger>
          <SelectContent>
            {marcas.map((marca) => (
              <SelectItem key={marca.id} value={marca.id}>
                {marca.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.marcaId && (
          <p className="text-sm text-destructive">{errors.marcaId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          {...register('nombre')}
          placeholder="Ej: GSB 13 RE, F-150, ThinkPad X1"
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
