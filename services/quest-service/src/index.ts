import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';

// Load environment variables
config();

const fastify = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] || 'info',
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet);

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Swagger documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Questlog Quest Service API',
        description: 'API for managing quests and tasks',
        version: '1.0.0',
      },
      host: process.env['HOST'] || 'localhost:3001',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
}

// Health check endpoint
fastify.get('/health', async (_request, reply) => {
  return reply.send({
    status: 'ok',
    service: 'quest-service',
    timestamp: new Date().toISOString(),
  });
});

// Get all quests endpoint
fastify.get('/quests', async (_request, reply) => {
  return reply.send({
    message: 'Get all quests endpoint - not implemented yet',
    status: 'pending',
  });
});

// Create quest endpoint
fastify.post('/quests', async (_request, reply) => {
  return reply.send({
    message: 'Create quest endpoint - not implemented yet',
    status: 'pending',
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();

    const port = process.env['PORT'] || 3001;
    const host = process.env['HOST'] || '0.0.0.0';

    await fastify.listen({ port: Number(port), host });

    console.log(`🚀 Quest Service running on http://${host}:${port}`);
    console.log(
      `📚 API Documentation available at http://${host}:${port}/docs`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Quest Service...');
  await fastify.close();
  process.exit(0);
});

start();
