import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { CategoriaForm } from '@/components/catalogos/categoria-form';

export default function NuevaCategoriaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/catalogos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Categoría</h1>
          <p className="text-muted-foreground">Catálogos &gt; Categorías &gt; Nueva</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Categoría</CardTitle>
          <CardDescription>Ingresa los datos de la nueva categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriaForm />
        </CardContent>
      </Card>
    </div>
  );
}
