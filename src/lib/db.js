import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

async function initDb() {
  const count = await prisma.scheduleConfig.count();
  if (count === 0) {
    await prisma.scheduleConfig.createMany({
      data: [
        { key: 'work_days', value: '1,2,3,4,5' },
        { key: 'work_start', value: '09:00' },
        { key: 'work_end', value: '17:00' },
        { key: 'appointment_duration', value: '30' },
      ],
    });
  }
}

let initialized = false;

async function getDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return prisma;
}

export default getDb;
