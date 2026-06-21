import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map();

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
}

function isLocked(ip) {
  const data = attempts.get(ip);
  if (!data) return false;
  if (data.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - data.lastAttempt;
    if (elapsed < LOCKOUT_MS) return true;
    attempts.delete(ip);
    return false;
  }
  return false;
}

function recordFailed(ip) {
  const data = attempts.get(ip) || { count: 0, lastAttempt: 0 };
  data.count += 1;
  data.lastAttempt = Date.now();
  attempts.set(ip, data);
}

function resetAttempts(ip) {
  attempts.delete(ip);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request) {
  const ip = getClientIp(request);

  if (isLocked(ip)) {
    const data = attempts.get(ip);
    const remaining = Math.ceil((LOCKOUT_MS - (Date.now() - data.lastAttempt)) / 60000);
    return NextResponse.json(
      { error: `Demasiados intentos. Intente de nuevo en ${remaining} minuto(s).` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const validUsername = username === process.env.ADMIN_USERNAME;
    const validPassword = password === process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      recordFailed(ip);
      const attemptsLeft = MAX_ATTEMPTS - (attempts.get(ip)?.count || 0);
      await delay(1000 + (MAX_ATTEMPTS - attemptsLeft) * 500);
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    resetAttempts(ip);

    const token = signToken({ username });

    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return NextResponse.json({ message: 'Inicio de sesión exitoso' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ message: 'Sesión cerrada' });
}
