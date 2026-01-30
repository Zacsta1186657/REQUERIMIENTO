import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { MarcaForm } from '@/components/catalogos/marca-form';

export default function NuevaMarcaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/catalogos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Marca</h1>
          <p className="text-muted-foreground">Catálogos &gt; Marcas &gt; Nueva</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Marca</CardTitle>
          <CardDescription>Ingresa los datos de la nueva marca</CardDescription>
        </CardHeader>
        <CardContent>
          <MarcaForm />
        </CardContent>
      </Card>
    </div>
  );
}
