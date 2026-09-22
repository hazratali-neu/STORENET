import mysql from 'mysql2/promise';

const globalForDb = globalThis;

export const pool =
  globalForDb.__storenetPool ??
  mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'storenet',
    waitForConnections: true,
    connectionLimit: 10,
  });

globalForDb.__storenetPool = pool;

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function audit(userId, action, fileId = null, detail = null) {
  try {
    await query(
      'INSERT INTO AuditLogs (user_id, action, file_id, detail) VALUES (?,?,?,?)',
      [userId ?? null, action, fileId ?? null, detail ?? null]
    );
  } catch (e) {
    console.error('audit failed', e.message);
  }
}