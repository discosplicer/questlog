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
        title: 'Questlog Auth Service API',
        description: 'API for user authentication and authorization',
        version: '1.0.0',
      },
      host: process.env['HOST'] || 'localhost:3002',
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
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// Basic auth endpoints
fastify.post('/api/v1/auth/register', async (_request, reply) => {
  return reply.send({
    message: 'User registration endpoint - not implemented yet',
    status: 'pending',
  });
});

fastify.post('/api/v1/auth/login', async (_request, reply) => {
  return reply.send({
    message: 'User login endpoint - not implemented yet',
    status: 'pending',
  });
});

fastify.post('/api/v1/auth/refresh', async (_request, reply) => {
  return reply.send({
    message: 'Token refresh endpoint - not implemented yet',
    status: 'pending',
  });
});

fastify.post('/api/v1/auth/logout', async (_request, reply) => {
  return reply.send({
    message: 'User logout endpoint - not implemented yet',
    status: 'pending',
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();

    const port = process.env['PORT'] || 3002;
    const host = process.env['HOST'] || '0.0.0.0';

    await fastify.listen({ port: Number(port), host });

    console.log(`🚀 Auth Service running on http://${host}:${port}`);
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
  console.log('Shutting down Auth Service...');
  await fastify.close();
  process.exit(0);
});

start();
