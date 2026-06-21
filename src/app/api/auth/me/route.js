import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    return NextResponse.json({ user: payload.username });
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
