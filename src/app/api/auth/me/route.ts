import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { unauthorizedResponse, serverErrorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedResponse('No autenticado');
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return serverErrorResponse();
  }
}
