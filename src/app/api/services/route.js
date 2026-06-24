import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const { rows } = await db.query('SELECT * FROM services WHERE active = TRUE ORDER BY id ASC');
  return NextResponse.json(rows);
}
