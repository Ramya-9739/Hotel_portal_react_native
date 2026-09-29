import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool, withTenant } from '../db';
import { z } from 'zod';

export default async function qrRoutes(app: FastifyInstance) {
  app.get('/q/:code', async (req: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ code: z.string() }).parse(req.params);
    
    // Find the QR code in the database
    const qrResult = await pool.query(
      `SELECT qr.id, qr.property_id, p.slug 
       FROM qr_codes qr
       JOIN properties p ON qr.property_id = p.id
       WHERE qr.short_code = $1`,
      [params.code]
    );

    if (qrResult.rows.length === 0) {
      return reply.redirect(302, '/not-found');
    }

    const { id: qrCodeId, property_id: propertyId, slug } = qrResult.rows[0];

    // Record the scan event using the guest role
    try {
      const userAgent = req.headers['user-agent'] || 'unknown';
      let deviceType = 'other';
      if (/mobile/i.test(userAgent)) deviceType = 'mobile';
      if (/tablet/i.test(userAgent)) deviceType = 'tablet';
      
      const language = req.headers['accept-language']?.split(',')[0] || 'en';

      await withTenant('guest', null, async (client) => {
        await client.query(
          `INSERT INTO scan_events (qr_code_id, property_id, device_type, language) 
           VALUES ($1, $2, $3, $4)`,
          [qrCodeId, propertyId, deviceType, language]
        );
      });
    } catch (e) {
      app.log.error(e, 'Failed to record scan event');
      // Do not block the redirect if scan recording fails
    }

    // Redirect to the property guest portal
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return reply.redirect(302, `${baseUrl}/h/${slug}`);
  });
}
