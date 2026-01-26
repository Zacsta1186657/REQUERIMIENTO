import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getCurrentUser, type AuthUser } from './auth';

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validationError(error: ZodError) {
  const errors = error.issues.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return NextResponse.json({ error: 'Validation error', errors }, { status: 400 });
}

export function unauthorizedResponse(message = 'No autorizado') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Acceso denegado') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message = 'Recurso no encontrado') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverErrorResponse(message = 'Error interno del servidor') {
  return NextResponse.json({ error: message }, { status: 500 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withAuth(
  handler: (user: AuthUser) => Promise<NextResponse<any>>
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }
  return handler(user);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withAdminAuth(
  handler: (user: AuthUser) => Promise<NextResponse<any>>
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }
  if (user.rol !== 'ADMIN' && user.rol !== 'ADMINISTRACION') {
    return forbiddenResponse();
  }
  return handler(user);
}

export function paginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
