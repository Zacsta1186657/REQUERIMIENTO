import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import type { UserRole } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!'
);

const TOKEN_NAME = 'auth-token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  rol: UserRole;
  nombre: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  avatar: string | null;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value || null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      avatar: true,
      activo: true,
    },
  });

  if (!user || !user.activo) return null;

  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol as UserRole,
    avatar: user.avatar,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}

export function canManageUsers(rol: UserRole): boolean {
  return rol === 'ADMIN' || rol === 'ADMINISTRACION';
}

export function canApproveStatus(
  rol: UserRole,
  status: string
): boolean {
  const approvalMap: Record<string, UserRole[]> = {
    VALIDACION_SEGURIDAD: ['SEGURIDAD'],
    VALIDACION_GERENCIA: ['GERENCIA'],
    EN_COMPRA: ['ADMINISTRACION', 'ADMIN'],
  };
  return approvalMap[status]?.includes(rol) || false;
}
