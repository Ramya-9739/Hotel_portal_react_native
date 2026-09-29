import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { withTenant } from '../db';

export default async function adminRoutes(app: FastifyInstance) {
  // Mock middleware to extract user role and orgId from token
  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    // In a real app, this would verify the Cognito JWT token.
    // For local dev, we look for a custom header or just mock it.
    const orgId = req.headers['x-mock-org-id'] as string;
    const role = req.headers['x-mock-role'] as string;

    if (!orgId || !role) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing mock headers' });
    }

    (req as any).user = { orgId, role };
  });

  app.get('/admin/properties', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    
    // Use the logged-in user's role and orgId to access DB
    const properties = await withTenant(user.role, user.orgId, async (client) => {
      const result = await client.query('SELECT * FROM properties ORDER BY name');
      return result.rows;
    });

    return { properties };
  });
}
