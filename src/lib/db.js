import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 30,
      active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      service_id INTEGER REFERENCES services(id),
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (NOW() AT TIME ZONE 'America/Mexico_City')::TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const { rows } = await query('SELECT COUNT(*)::INT AS count FROM schedule_config');
  if (rows[0].count === 0) {
    await query('INSERT INTO schedule_config (key, value) VALUES ($1, $2)', ['work_days', '1,2,3,4,5']);
    await query('INSERT INTO schedule_config (key, value) VALUES ($1, $2)', ['work_start', '09:00']);
    await query('INSERT INTO schedule_config (key, value) VALUES ($1, $2)', ['work_end', '17:00']);
    await query('INSERT INTO schedule_config (key, value) VALUES ($1, $2)', ['appointment_duration', '30']);
  }
}

let initialized = false;

async function getDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
  return { query };
}

export default getDb;
