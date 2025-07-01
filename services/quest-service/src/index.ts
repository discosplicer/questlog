import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';
import prisma from './prisma';
import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from '@questlog/shared';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { config as appConfig } from './config/environment';

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

  // Get all quests endpoint
  fastify.get('/quests', async (_request, reply) => {
    return reply.send({
      message: 'Get all quests endpoint - not implemented yet',
      status: 'pending',
    });
  });

  // User registration endpoint
  const userRegistrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
    displayName: z.string().max(100).optional(),
  });

  fastify.post('/users', async (request, reply) => {
    try {
      const body = userRegistrationSchema.parse(request.body);
      const hashedPassword = await bcrypt.hash(
        body.password,
        appConfig.security.bcryptRounds
      );
      const user = await prisma.user.create({
        data: {
          email: body.email,
          username: body.username,
          displayName: body.displayName ?? null,
          passwordHash: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return reply.code(201).send({ success: true, data: user });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: err.errors,
        });
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          return reply.code(409).send({
            success: false,
            error: 'User with this email or username already exists',
          });
        }
      }

      request.log.error(err);
      return reply
        .code(500)
        .send({ success: false, error: 'Internal server error' });
    }
  });

  // Create quest endpoint
  fastify.post('/quests', async (_request, reply) => {
    return reply.send({
      message: 'Create quest endpoint - not implemented yet',
      status: 'pending',
    });
  });

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
      console.log(
        `🚀 Quest Service running on http://${appConfig.server.host}:${appConfig.server.port}`
      );
      console.log(
        `📚 API Documentation available at http://${appConfig.server.host}:${appConfig.server.port}/docs`
      );
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  })();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down Quest Service...');
    process.exit(0);
  });
}
