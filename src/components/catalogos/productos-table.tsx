'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Producto {
  id: string;
  numeroParte: string | null;
  descripcion: string;
  categoriaId: string;
  marcaId: string;
  modeloId: string;
  activo: boolean;
  categoria: {
    nombre: string;
  };
  marca: {
    nombre: string;
  };
  modelo: {
    nombre: string;
  };
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Marca {
  id: string;
  nombre: string;
}

export function ProductosTable() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('all');
  const [marcaId, setMarcaId] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/catalogos/categorias?limit=1000&activo=true');
      const data = await response.json();
      setCategorias(data.data || []);
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const response = await fetch('/api/catalogos/marcas?limit=1000&activo=true');
      const data = await response.json();
      setMarcas(data.data || []);
    } catch (error) {
      console.error('Error fetching marcas:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      let url = `/api/catalogos/productos?page=${currentPage}&limit=${itemsPerPage}&search=${search}`;
      if (categoriaId && categoriaId !== 'all') {
        url += `&categoriaId=${categoriaId}`;
      }
      if (marcaId && marcaId !== 'all') {
        url += `&marcaId=${marcaId}`;
      }
      // Filtro de activos: por defecto solo activos, si showInactive está activado mostrar todos
      if (!showInactive) {
        url += '&activo=true';
      } else {
        url += '&activo=false';
      }
      const response = await fetch(url);
      const data = await response.json();
      setProductos(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching productos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los productos',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchMarcas();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [search, categoriaId, marcaId, showInactive, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoriaId, marcaId, showInactive]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/catalogos/productos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: data.message || 'Producto eliminado exitosamente',
        });
        fetchProductos();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo eliminar el producto',
        });
      }
    } catch (error) {
      console.error('Error deleting producto:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al eliminar el producto',
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showInactive"
              checked={showInactive}
              onCheckedChange={(checked) => setShowInactive(checked as boolean)}
            />
            <Label htmlFor="showInactive" className="text-sm cursor-pointer">
              Mostrar inactivos
            </Label>
          </div>
          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={marcaId} onValueChange={setMarcaId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {marcas.map((marca) => (
                <SelectItem key={marca.id} value={marca.id}>
                  {marca.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/catalogos/productos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Parte</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-mono text-sm">
                    {producto.numeroParte || '-'}
                  </TableCell>
                  <TableCell className="font-medium">{producto.descripcion}</TableCell>
                  <TableCell>{producto.categoria.nombre}</TableCell>
                  <TableCell>{producto.marca.nombre}</TableCell>
                  <TableCell>{producto.modelo.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={producto.activo ? 'default' : 'secondary'}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/catalogos/productos/${producto.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(producto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
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
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto se marcará como inactivo y no aparecerá en los listados principales.
              {deleteId && productos.find(p => p.id === deleteId)?.activo === false
                ? " Este producto ya está inactivo."
                : " Podrás reactivarlo más tarde desde el filtro de inactivos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
