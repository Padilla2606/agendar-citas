import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 30,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        service_id INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (service_id) REFERENCES services(id)
      );

      CREATE TABLE IF NOT EXISTS schedule_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const hasConfig = db.prepare('SELECT COUNT(*) as count FROM schedule_config').get();
    if (hasConfig.count === 0) {
      const insert = db.prepare('INSERT INTO schedule_config (key, value) VALUES (?, ?)');
      insert.run('work_days', '1,2,3,4,5');
      insert.run('work_start', '09:00');
      insert.run('work_end', '17:00');
      insert.run('appointment_duration', '30');
    }

    const columns = db.prepare("PRAGMA table_info(appointments)").all();
    const hasServiceId = columns.some((c) => c.name === 'service_id');
    if (!hasServiceId) {
      db.exec("ALTER TABLE appointments ADD COLUMN service_id INTEGER REFERENCES services(id)");
    }
  }
  return db;
}

export default getDb;
