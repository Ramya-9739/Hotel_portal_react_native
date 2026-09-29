import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPropertyParamsSchema, postScanBodySchema } from '../schemas/public';
import { withTenant, pool } from '../db';
import { z } from 'zod';

export default async function publicRoutes(app: FastifyInstance) {
  app.get('/public/properties/:slug', async (req: FastifyRequest, reply: FastifyReply) => {
    const params = getPropertyParamsSchema.parse(req.params);
    
    // We use the guest role.
    const propertyData = await withTenant('guest', null, async (client) => {
      const propResult = await client.query(
        `SELECT id, organization_id, name, slug, tagline, description, address, 
                lat, lng, phone, whatsapp, wifi_name, wifi_password, show_wifi, 
                cover_key, gallery_keys, status 
         FROM properties WHERE slug = $1 AND status = 'published'`,
        [params.slug]
      );
      
      if (propResult.rows.length === 0) {
        return null;
      }
      
      const property = propResult.rows[0];
      
      // Get brand details via public_property_brands view
      const brandResult = await client.query(
        `SELECT brand_primary_color, logo_key FROM public_property_brands WHERE property_slug = $1`,
        [params.slug]
      );
      
      // Get categories and places linked to this property
      const placesResult = await client.query(
        `SELECT p.id, p.category_id, p.name, p.description, p.address, p.lat, p.lng,
                p.phone, p.website, p.hours, p.image_keys, p.tags,
                pp.distance_m, pp.duration_walk_s, pp.duration_drive_s,
                c.key as category_key, c.label as category_label, c.icon_key as category_icon
         FROM places p
         JOIN property_places pp ON p.id = pp.place_id
         JOIN place_categories c ON p.category_id = c.id
         WHERE pp.property_id = $1
         ORDER BY c.sort_order, pp.sort_order`,
        [property.id]
      );
      
      return {
        property,
        brand: brandResult.rows[0] || null,
        places: placesResult.rows,
      };
    });
    
    if (!propertyData) {
      return reply.status(404).send({ error: 'Property not found or not published' });
    }
    
    return propertyData;
  });

  app.post('/public/scan', async (req: FastifyRequest, reply: FastifyReply) => {
    console.log('REQ BODY:', req.body);
    const body = postScanBodySchema.parse(req.body);
    
    // Guest role can insert scan events for published properties
    // We need to resolve property_id from qr_code_id
    const qrResult = await pool.query('SELECT property_id FROM qr_codes WHERE id = $1', [body.qrCodeId]);
    if (qrResult.rows.length === 0) {
       return reply.status(404).send({ error: 'QR Code not found' });
    }
    const propertyId = qrResult.rows[0].property_id;
    
    await withTenant('guest', null, async (client) => {
       await client.query(
         `INSERT INTO scan_events (qr_code_id, property_id, device_type, language) 
          VALUES ($1, $2, $3, $4)`,
         [body.qrCodeId, propertyId, body.deviceType, body.language]
       );
    });
    
    return { success: true };
  });
}
