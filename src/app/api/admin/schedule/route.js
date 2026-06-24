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
  const rows = await db.scheduleConfig.findMany();
  const config = {};
  rows.forEach((row) => { config[row.key] = row.value; });
  return NextResponse.json(config);
}

export async function PUT(request) {
  const auth = await checkAuth();
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = await getDb();

    const upsert = async (key, value) => {
      await db.scheduleConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    };

    if (body.work_days !== undefined) await upsert('work_days', body.work_days);
    if (body.work_start !== undefined) await upsert('work_start', body.work_start);
    if (body.work_end !== undefined) await upsert('work_end', body.work_end);
    if (body.appointment_duration !== undefined) await upsert('appointment_duration', String(body.appointment_duration));

    return NextResponse.json({ message: 'Configuración guardada' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
