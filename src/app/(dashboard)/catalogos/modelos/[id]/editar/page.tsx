import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ModeloForm } from '@/components/catalogos/modelo-form';

export default async function EditarModeloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/catalogos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Modelo</h1>
          <p className="text-muted-foreground">Catálogos &gt; Modelos &gt; Editar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Modelo</CardTitle>
          <CardDescription>Modifica los datos del modelo</CardDescription>
        </CardHeader>
        <CardContent>
          <ModeloForm id={id} />
        </CardContent>
      </Card>
    </div>
  );
}
