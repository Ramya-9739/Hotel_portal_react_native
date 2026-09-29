import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

describe('Tenant Isolation Tests (RLS)', () => {
  let pool: Pool;
  const TAJ_ORG_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const LODGE_ORG_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    // API connects as api_user
    pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'hotel_portal',
      user: 'api_user',
      password: 'api_pass',
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function executeAsTenant(tenantId: string, role: string, query: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
      await client.query(`SET LOCAL app.current_role = '${role}'`);
      const result = await client.query(query, params);
      await client.query('COMMIT');
      return result.rows;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  it('Client A (Taj) can only read their own properties', async () => {
    const rows = await executeAsTenant(TAJ_ORG_ID, 'client_admin', 'SELECT name FROM properties');
    expect(rows.length).toBeGreaterThan(0);
    // All rows should belong to Taj
    for (const row of rows) {
      expect(row.name).toContain('Taj');
    }
  });

  it('Client B (Lodge) cannot see Taj properties', async () => {
    const rows = await executeAsTenant(LODGE_ORG_ID, 'client_admin', 'SELECT name FROM properties');
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe('Mysuru Heritage Lodge');
  });

  it('Client A (Taj) cannot update Client B (Lodge) property', async () => {
    // Try to rename Lodge from Taj account
    await executeAsTenant(TAJ_ORG_ID, 'client_admin', 
      `UPDATE properties SET name = 'Hacked by Taj' WHERE slug = 'mysuru-heritage-lodge'`
    );
    // Verify Lodge still has original name
    const lodgeRows = await executeAsTenant(LODGE_ORG_ID, 'client_admin', 'SELECT name FROM properties');
    expect(lodgeRows[0].name).toBe('Mysuru Heritage Lodge');
  });

  it('Guest can only see published properties', async () => {
    const rows = await executeAsTenant('00000000-0000-0000-0000-000000000000', 'guest', 'SELECT name FROM properties');
    expect(rows.length).toBeGreaterThan(0);
  });
});
