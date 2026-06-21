import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const serviceId = searchParams.get('service_id');

  if (!date) {
    return NextResponse.json({ error: 'Fecha es obligatoria' }, { status: 400 });
  }

  const db = getDb();

  const configRows = db.prepare('SELECT * FROM schedule_config').all();
  const config = {};
  configRows.forEach((row) => { config[row.key] = row.value; });

  let duration = parseInt(config.appointment_duration || '30', 10);

  if (serviceId) {
    const service = db.prepare('SELECT duration FROM services WHERE id = ? AND active = 1').get(serviceId);
    if (service) {
      duration = service.duration;
    }
  }

  const workDays = (config.work_days || '1,2,3,4,5').split(',').map(Number);
  const workStart = config.work_start || '09:00';
  const workEnd = config.work_end || '17:00';

  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  if (!workDays.includes(dayOfWeek)) {
    return NextResponse.json({ slots: [], message: 'Día no laboral' });
  }

  const existingAppointments = db.prepare(
    "SELECT time FROM appointments WHERE date = ? AND status != 'cancelled'"
  ).all(date).map((r) => r.time);

  const slots = [];
  const [startH, startM] = workStart.split(':').map(Number);
  const [endH, endM] = workEnd.split(':').map(Number);
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + duration <= endMinutes) {
    const h = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const m = String(currentMinutes % 60).padStart(2, '0');
    const timeStr = `${h}:${m}`;

    if (!existingAppointments.includes(timeStr)) {
      slots.push(timeStr);
    }

    currentMinutes += duration;
  }

  return NextResponse.json({ slots, duration });
}
