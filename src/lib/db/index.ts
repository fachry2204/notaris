import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'mysql://root@localhost:3306/notaris';

// Parse connection string
const url = new URL(connectionString);

const createPool = () => mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.replace('/', '') || 'notaris',
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const globalForDb = globalThis as unknown as {
  pool: ReturnType<typeof createPool> | undefined;
};

const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema, mode: 'default' });

// Export schema for convenience
export * from './schema';
