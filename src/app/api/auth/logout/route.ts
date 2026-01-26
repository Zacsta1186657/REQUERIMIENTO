import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';
import { serverErrorResponse } from '@/lib/api-utils';

export async function POST() {
  try {
    await removeAuthCookie();
    return NextResponse.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Logout error:', error);
    return serverErrorResponse();
  }
}
