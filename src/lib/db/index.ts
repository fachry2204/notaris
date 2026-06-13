import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'mysql://root@localhost:3306/notaris';

// Parse connection string
const url = new URL(connectionString);
const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.replace('/', '') || 'notaris',
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: 'default' });

// Export schema for convenience
export * from './schema';
