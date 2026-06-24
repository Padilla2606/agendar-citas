import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import getDb from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  return verifyToken(token.value);
}

export async function GET() {
  const auth = await checkAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getDb();
  const { rows } = await db.query('SELECT * FROM appointments ORDER BY date DESC, time DESC');
  return NextResponse.json(rows);
}

export async function PATCH(request) {
  const auth = await checkAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID y status son obligatorios' },
        { status: 400 }
      );
    }

    const db = await getDb();
    await db.query('UPDATE appointments SET status = $1 WHERE id = $2', [status, id]);

    return NextResponse.json({ message: 'Cita actualizada' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar la cita' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = await checkAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID es obligatorio' },
        { status: 400 }
      );
    }

    const db = await getDb();
    await db.query('DELETE FROM appointments WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Cita eliminada' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar la cita' },
      { status: 500 }
    );
  }
}
