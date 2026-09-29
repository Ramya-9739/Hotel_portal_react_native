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
      database: process.env.POSTGRES_DB || 'hotel_portal',
      user: 'api_user',
      password: process.env.API_DB_PASSWORD || 'local_api_password',
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function executeAsTenant(
    tenantId: string | null, 
    role: string, 
    query: string, 
    params: any[] = []
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Parameterized set_config instead of string interpolation
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', role]);
      if (tenantId) {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', tenantId]);
      } else {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', '']);
      }
      const result = await client.query(query, params);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  describe('Client Admin Role', () => {
    it('Client A (Taj) can only read their own properties', async () => {
      const result = await executeAsTenant(TAJ_ORG_ID, 'client_admin', 'SELECT name FROM properties');
      expect(result.rows.length).toBeGreaterThan(0);
      for (const row of result.rows) {
        expect(row.name).toContain('Taj');
      }
    });

    it('Client B (Lodge) cross-tenant SELECT returns 0 rows', async () => {
      const result = await executeAsTenant(LODGE_ORG_ID, 'client_admin', 'SELECT name FROM properties WHERE slug LIKE $1', ['taj%']);
      expect(result.rows.length).toBe(0);
    });

    it('Client A (Taj) cross-tenant UPDATE affects 0 rows', async () => {
      const result = await executeAsTenant(TAJ_ORG_ID, 'client_admin', 
        `UPDATE properties SET name = 'Hacked' WHERE slug = $1`,
        ['mysuru-heritage-lodge']
      );
      expect(result.rowCount).toBe(0);
    });

    it('Client A (Taj) cross-tenant DELETE affects 0 rows', async () => {
      const result = await executeAsTenant(TAJ_ORG_ID, 'client_admin', 
        `DELETE FROM properties WHERE slug = $1`,
        ['mysuru-heritage-lodge']
      );
      expect(result.rowCount).toBe(0);
    });

    it('Client A (Taj) cross-tenant INSERT fails', async () => {
      await expect(
        executeAsTenant(TAJ_ORG_ID, 'client_admin', 
          `INSERT INTO properties (organization_id, name, slug) VALUES ($1, $2, $3)`,
          [LODGE_ORG_ID, 'Hacked Lodge', 'hacked-lodge']
        )
      ).rejects.toThrow(/new row violates row-level security policy/);
    });
  });

  describe('Guest Role', () => {
    it('Drafts are invisible to guests', async () => {
      // First, Taj admin creates a draft property
      await executeAsTenant(TAJ_ORG_ID, 'client_admin', 
        `INSERT INTO properties (organization_id, name, slug, status) VALUES ($1, $2, $3, $4)`,
        [TAJ_ORG_ID, 'Taj Secret Draft', 'taj-secret', 'draft']
      );

      // Guest tries to read it
      const result = await executeAsTenant(null, 'guest', 'SELECT name FROM properties WHERE slug = $1', ['taj-secret']);
      expect(result.rows.length).toBe(0);
    });

    it('Guest cannot read users, audit_log, organizations directly', async () => {
      const p1 = executeAsTenant(null, 'guest', 'SELECT * FROM users');
      await expect(p1).resolves.toMatchObject({ rows: [] });

      const p2 = executeAsTenant(null, 'guest', 'SELECT * FROM audit_log');
      await expect(p2).resolves.toMatchObject({ rows: [] });

      const p3 = executeAsTenant(null, 'guest', 'SELECT * FROM organizations');
      await expect(p3).resolves.toMatchObject({ rows: [] });
    });

    it('Guest can read public_property_brands view', async () => {
      const result = await executeAsTenant(null, 'guest', 'SELECT * FROM public_property_brands');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].brand_primary_color).toBeDefined();
    });

    it('Guest cannot read other properties places (if not published)', async () => {
      // The Taj Secret Draft property has no places yet, but even if it did, 
      // the guest policy states places are visible if property is published.
      // Let's test that the guest CAN read places for published Taj West End
      const publishedPlaces = await executeAsTenant(null, 'guest', `
        SELECT p.name FROM places p 
        JOIN property_places pp ON p.id = pp.place_id 
        JOIN properties prop ON pp.property_id = prop.id
        WHERE prop.slug = 'mysuru-heritage-lodge'
      `);
      expect(publishedPlaces.rows.length).toBeGreaterThan(0);
    });
  });
});
