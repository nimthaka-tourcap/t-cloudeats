import { Pool, PoolClient } from "pg";

// Allow Supabase pooler SSL in Node server environment
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const globalForPg = globalThis as unknown as {
  tcePgPool: Pool | undefined;
};

export function getPool(): Pool {
  if (!globalForPg.tcePgPool) {
    const connectionString =
      process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error("Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING in environment");
    }

    globalForPg.tcePgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return globalForPg.tcePgPool;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
