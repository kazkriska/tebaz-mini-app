import { Pool } from "pg";

/**
 * We use a global variable to ensure the pool is not re-initialized
 * multiple times during development with Fast Refresh.
 */
let pool;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
    ssl: { rejectUnauthorized: false }, // Common requirement for production
  });
} else {
  // In development, use a global variable so the pool survives HMR
  if (!global.pgPool) {
    global.pgPool = new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: Number(process.env.PG_PORT),
    });
  }
  pool = global.pgPool;
}

export default pool;
