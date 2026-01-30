'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductosTable } from '@/components/catalogos/productos-table';
import { MarcasTable } from '@/components/catalogos/marcas-table';
import { ModelosTable } from '@/components/catalogos/modelos-table';
import { CategoriasTable } from '@/components/catalogos/categorias-table';

export default function CatalogosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Catálogos</h1>
        <p className="text-muted-foreground">
          Administra productos, marcas, modelos y categorías del sistema
        </p>
      </div>

      <Tabs defaultValue="productos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="marcas">Marcas</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>
                Catálogo completo de productos disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductosTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marcas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marcas</CardTitle>
              <CardDescription>
                Marcas de productos registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarcasTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modelos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modelos</CardTitle>
              <CardDescription>
                Modelos de productos por marca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelosTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>
                Categorías de clasificación de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriasTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
