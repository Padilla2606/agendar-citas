import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY id ASC').all();
  return NextResponse.json(services);
}
