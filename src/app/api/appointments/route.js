import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  const db = getDb();
  const appointments = db.prepare(
    'SELECT * FROM appointments ORDER BY date DESC, time DESC'
  ).all();
  return NextResponse.json(appointments);
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

    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO appointments (name, phone, date, time, service_id) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, phone, date, time, service_id ? Number(service_id) : null);

    return NextResponse.json(
      { message: 'Cita agendada exitosamente', id: result.lastInsertRowid },
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
