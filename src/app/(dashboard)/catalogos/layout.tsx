import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function CatalogosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Solo LOGISTICA, ADMINISTRACION y ADMIN pueden acceder a catálogos
  const allowedRoles = ['LOGISTICA', 'ADMINISTRACION', 'ADMIN'];
  if (!allowedRoles.includes(user.rol)) {
    redirect('/');
  }

  return <>{children}</>;
}
