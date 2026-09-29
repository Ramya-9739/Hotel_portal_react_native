import { Pool, PoolClient } from 'pg';


export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'hotel_portal',
  user: process.env.DB_USER || 'api_user',
  password: process.env.API_DB_PASSWORD || 'local_api_password',
});

/**
 * Executes a function within a transaction configured for the specified tenant and role.
 */
export async function withTenant<T>(
  role: 'super_admin' | 'client_admin' | 'guest',
  orgId: string | null,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_role', role]);
    
    if (orgId) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', orgId]);
    } else {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', '']);
    }
    
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
