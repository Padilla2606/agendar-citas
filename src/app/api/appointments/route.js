import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const appointments = await db.appointment.findMany({
    orderBy: [{ date: 'desc' }, { time: 'desc' }],
  });
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

    const db = await getDb();
    const appointment = await db.appointment.create({
      data: {
        name,
        phone,
        date,
        time,
        serviceId: service_id ? Number(service_id) : null,
      },
    });

    return NextResponse.json(
      { message: 'Cita agendada exitosamente', id: appointment.id },
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
