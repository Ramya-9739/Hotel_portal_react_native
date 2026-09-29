import { z } from 'zod';

export const getPropertyParamsSchema = z.object({
  slug: z.string(),
});

export const postScanBodySchema = z.object({
  qrCodeId: z.string().uuid(),
  deviceType: z.string().optional(),
  language: z.string().optional(),
});
