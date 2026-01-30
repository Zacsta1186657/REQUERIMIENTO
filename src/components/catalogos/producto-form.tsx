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
import { Textarea } from '@/components/ui/textarea';
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
import { createProductoSchema } from '@/lib/validations/producto';
import { useCatalogosStore } from '@/stores/catalogos-store';

type FormData = {
  numeroParte?: string | null;
  descripcion: string;
  categoriaId: string;
  marcaId: string;
  modeloId: string;
  activo?: boolean;
};

interface ProductoFormProps {
  id?: string;
}

export function ProductoForm({ id }: ProductoFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!id;

  const {
    categorias,
    marcas,
    modelos,
    fetchCategorias,
    fetchMarcas,
    fetchModelos,
  } = useCatalogosStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createProductoSchema),
    defaultValues: {
      numeroParte: '',
      descripcion: '',
      categoriaId: '',
      marcaId: '',
      modeloId: '',
      activo: true,
    },
  });

  const activo = watch('activo');
  const marcaId = watch('marcaId');
  const modeloId = watch('modeloId');

  useEffect(() => {
    fetchCategorias();
    fetchMarcas();
  }, [fetchCategorias, fetchMarcas]);

  useEffect(() => {
    if (marcaId) {
      fetchModelos(marcaId);
      if (modeloId) {
        const modeloExists = modelos.find((m) => m.id === modeloId && m.marcaId === marcaId);
        if (!modeloExists) {
          setValue('modeloId', '');
        }
      }
    } else {
      setValue('modeloId', '');
    }
  }, [marcaId, fetchModelos]);

  useEffect(() => {
    if (id) {
      fetchProducto();
    }
  }, [id]);

  const fetchProducto = async () => {
    try {
      const response = await fetch(`/api/catalogos/productos/${id}`);
      if (response.ok) {

        const producto = await response.json();
        setValue('numeroParte', producto.numeroParte || '');
        setValue('descripcion', producto.descripcion);
        setValue('categoriaId', producto.categoriaId);
        setValue('marcaId', producto.marcaId);
        setValue('modeloId', producto.modeloId);
        setValue('activo', producto.activo);

        // Fetch modelos for the selected marca
        if (producto.marcaId) {
          fetchModelos(producto.marcaId);
        }
      }
    } catch (error) {
      console.error('Error fetching producto:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      // Convert empty string to null for numeroParte
      const submitData = {
        ...data,
        numeroParte: data.numeroParte?.trim() || null,
      };

      const url = isEdit
        ? `/api/catalogos/productos/${id}`
        : '/api/catalogos/productos';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: isEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
        });
        router.push('/catalogos');
      } else {
        setError(result.error || 'Error al guardar el producto');
      }
    } catch (error) {
      console.error('Error saving producto:', error);
      setError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const filteredModelos = modelos.filter((modelo) => modelo.marcaId === marcaId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoriaId">Categoría *</Label>
          <Select
            value={watch('categoriaId')}
            onValueChange={(value) => setValue('categoriaId', value)}
          >
            <SelectTrigger id="categoriaId">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoriaId && (
            <p className="text-sm text-destructive">{errors.categoriaId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numeroParte">Número de Parte</Label>
          <Input
            id="numeroParte"
            {...register('numeroParte')}
            placeholder="Ej: ABC-123, SKU-001"
            disabled={loading}
          />
          {errors.numeroParte && (
            <p className="text-sm text-destructive">{errors.numeroParte.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          {...register('descripcion')}
          placeholder="Descripción detallada del producto"
          disabled={loading}
          rows={3}
        />
        {errors.descripcion && (
          <p className="text-sm text-destructive">{errors.descripcion.message}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marcaId">Marca *</Label>
          <Select
            value={marcaId}
            onValueChange={(value) => setValue('marcaId', value)}
          >
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
          <Label htmlFor="modeloId">Modelo *</Label>
          <Select
            value={modeloId}
            onValueChange={(value) => setValue('modeloId', value)}
            disabled={!marcaId}
          >
            <SelectTrigger id="modeloId">
              <SelectValue placeholder={marcaId ? "Selecciona un modelo" : "Primero selecciona una marca"} />
            </SelectTrigger>
            <SelectContent>
              {filteredModelos.map((modelo) => (
                <SelectItem key={modelo.id} value={modelo.id}>
                  {modelo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.modeloId && (
            <p className="text-sm text-destructive">{errors.modeloId.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-start space-x-2">
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
