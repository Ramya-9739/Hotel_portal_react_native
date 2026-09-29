import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withTenant } from '../db';

export default async function superRoutes(app: FastifyInstance) {
  // Mock middleware for super_admin
  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    const role = req.headers['x-mock-role'] as string;

    if (role !== 'super_admin') {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Must be super admin' });
    }

    (req as any).user = { role };
  });

  app.get('/super/clients', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    
    // Use the super_admin role with no specific orgId
    const data = await withTenant(user.role, null, async (client) => {
      const orgsResult = await client.query('SELECT * FROM organizations ORDER BY name');
      const propsResult = await client.query('SELECT id, organization_id, name, slug, status FROM properties');
      const auditResult = await client.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10');
      
      return {
        organizations: orgsResult.rows,
        properties: propsResult.rows,
        auditLogs: auditResult.rows
      };
    });

    return data;
  });
}
