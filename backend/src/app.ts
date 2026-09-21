import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { authRoutes } from './routes/auth.routes.js';
import { houseRoutes } from './routes/house.routes.js';
import { taskRoutes } from './routes/task.routes.js';
import { financeRoutes } from './routes/finance.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { vesselRoutes } from './routes/vessel.routes.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Health checks
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/api/v1/health', async () => {
    return {
      status: 'ok',
      service: 'homie-home-api',
      timestamp: new Date().toISOString(),
    };
  });

  // Route registration
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(houseRoutes, { prefix: '/api/v1/houses' });
  app.register(taskRoutes, { prefix: '/api/v1' });
  app.register(financeRoutes, { prefix: '/api/v1' });
  app.register(aiRoutes, { prefix: '/api/v1/ai' });
  app.register(vesselRoutes, { prefix: '/api/v1' });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors.map(e => e.message).join(', '),
        },
      });
      return;
    }

    const err = error as { statusCode?: number; code?: string; message?: string };
    reply.status(err.statusCode ?? 500).send({
      success: false,
      error: {
        code: err.code ?? 'INTERNAL_SERVER_ERROR',
        message: err.message ?? 'An unexpected error occurred',
      },
    });
  });

  return app;
}
