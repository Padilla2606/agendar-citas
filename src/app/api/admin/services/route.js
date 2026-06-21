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

  const db = getDb();
  const services = db.prepare('SELECT * FROM services ORDER BY id ASC').all();
  return NextResponse.json(services);
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

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO services (name, duration) VALUES (?, ?)'
    ).run(name, Number(duration));

    return NextResponse.json(
      { message: 'Servicio creado', id: result.lastInsertRowid },
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

    const db = getDb();
    if (name !== undefined && duration !== undefined) {
      db.prepare('UPDATE services SET name = ?, duration = ? WHERE id = ?')
        .run(name, Number(duration), id);
    }
    if (active !== undefined) {
      db.prepare('UPDATE services SET active = ? WHERE id = ?')
        .run(active ? 1 : 0, id);
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

    const db = getDb();
    db.prepare('DELETE FROM services WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Servicio eliminado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}
