import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const { rows } = await db.query('SELECT * FROM appointments ORDER BY date DESC, time DESC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, date, time, service_id } = body;

    if (!name || !phone || !date || !time) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const { rows } = await db.query(
      'INSERT INTO appointments (name, phone, date, time, service_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, phone, date, time, service_id ? Number(service_id) : null]
    );

    return NextResponse.json(
      { message: 'Cita agendada exitosamente', id: rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    return NextResponse.json(
      { error: 'Error al agendar la cita' },
      { status: 500 }
    );
  }
}
