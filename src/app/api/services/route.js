import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const services = await db.service.findMany({
    where: { active: true },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json(services);
}
