import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';
import { config as appConfig } from './config/environment';
import { registerQuestRoutes } from './routes/quests';
import { registerUserRoutes } from './routes/users';
import { registerErrorHandler } from './middleware/errorHandler';

// Load environment variables
config();

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: appConfig.logging.level,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: appConfig.cors.allowedOrigins,
    credentials: true,
  });
  await fastify.register(helmet);
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Questlog Quest Service API',
        description: 'API for managing quests and tasks',
        version: '1.0.0',
      },
      host: appConfig.server.host,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'quest-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Register error handler
  registerErrorHandler(fastify);

  // Register route modules
  await registerQuestRoutes(fastify);
  await registerUserRoutes(fastify);

  return fastify;
}

// Only start the server if this file is run directly
if (require.main === module) {
  (async () => {
    const fastify = await buildServer();
    try {
      await fastify.listen({
        port: appConfig.server.port,
        host: appConfig.server.host,
      });
      fastify.log.info(
        `🚀 Quest Service running on http://${appConfig.server.host}:${appConfig.server.port}`
      );
      fastify.log.info(
        `📚 API Documentation available at http://${appConfig.server.host}:${appConfig.server.port}/docs`
      );
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  })();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    process.exit(0);
  });
}
