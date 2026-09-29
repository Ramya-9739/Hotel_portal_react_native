import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import publicRoutes from './routes/public';
import { ZodError } from 'zod';

export function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // Plugins
  app.register(helmet, {
    crossOriginResourcePolicy: false,
  });
  
  app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  });
  
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Routes
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.register(publicRoutes);

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    console.error('GLOBAL ERROR:', error);
    if (error instanceof ZodError) {
      console.error('Zod Error Issues:', error.issues);
      reply.status(400).send({
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    app.log.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  });

  return app;
}
