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
  const services = await db.service.findMany({ orderBy: { id: 'asc' } });
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

    const db = await getDb();
    const service = await db.service.create({
      data: { name, duration: Number(duration) },
    });

    return NextResponse.json(
      { message: 'Servicio creado', id: service.id },
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
    const data = {};
    if (name !== undefined && duration !== undefined) {
      data.name = name;
      data.duration = Number(duration);
    }
    if (active !== undefined) {
      data.active = Boolean(active);
    }

    await db.service.update({ where: { id: Number(id) }, data });

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
    await db.service.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: 'Servicio eliminado' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    );
  }
}
