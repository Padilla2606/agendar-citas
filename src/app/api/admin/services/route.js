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
  const { rows } = await db.query('SELECT * FROM services ORDER BY id ASC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  const auth = await checkAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, duration } = body;

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Nombre y duración son obligatorios' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const { rows } = await db.query(
      'INSERT INTO services (name, duration) VALUES ($1, $2) RETURNING id',
      [name, Number(duration)]
    );

    return NextResponse.json(
      { message: 'Servicio creado', id: rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const auth = await checkAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, duration, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });
    }

    const db = await getDb();
    if (name !== undefined && duration !== undefined) {
      await db.query('UPDATE services SET name = $1, duration = $2 WHERE id = $3', [name, Number(duration), id]);
    }
    if (active !== undefined) {
      await db.query('UPDATE services SET active = $1 WHERE id = $2', [active, id]);
    }

    return NextResponse.json({ message: 'Servicio actualizado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
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
      return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });
    }

    const db = await getDb();
    await db.query('DELETE FROM services WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Servicio eliminado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}
