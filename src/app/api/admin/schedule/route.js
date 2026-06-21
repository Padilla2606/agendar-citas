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
  const rows = db.prepare('SELECT * FROM schedule_config').all();
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
    const db = getDb();
    const upsert = db.prepare(
      'INSERT INTO schedule_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    const tx = db.transaction(() => {
      if (body.work_days !== undefined) upsert.run('work_days', body.work_days);
      if (body.work_start !== undefined) upsert.run('work_start', body.work_start);
      if (body.work_end !== undefined) upsert.run('work_end', body.work_end);
      if (body.appointment_duration !== undefined) upsert.run('appointment_duration', String(body.appointment_duration));
    });
    tx();

    return NextResponse.json({ message: 'Configuración guardada' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
