import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ JWT_SECRET environment variable is MISSING. Please set it in your environment variables.');
  } else {
    console.warn('⚠️  JWT_SECRET is missing. Using an insecure fallback for development only.');
  }
}

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-fallback-only-change-this-in-production');

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setSession(adminId: string) {
  const token = await signToken({ adminId });
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
