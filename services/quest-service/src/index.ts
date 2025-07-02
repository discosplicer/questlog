import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from 'dotenv';
import prisma from './prisma';
import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  questTitleSchema,
  questDescriptionSchema,
  questDurationSchema,
  questDifficultySchema,
  questStatusSchema,
  questPrioritySchema,
  sanitizeInput,
} from '@questlog/shared';
import { QuestPriority, QuestStatus, QuestDifficulty } from '@questlog/types';
import bcrypt from 'bcryptjs';
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

  // Quest validation schemas
  const createQuestSchema = z.object({
    title: questTitleSchema,
    description: questDescriptionSchema,
    difficulty: questDifficultySchema,
    estimatedDuration: questDurationSchema,
    priority: questPrioritySchema.optional().default(QuestPriority.MEDIUM),
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string().max(50)).optional(),
  });

  const updateQuestSchema = z.object({
    title: questTitleSchema.optional(),
    description: questDescriptionSchema,
    difficulty: questDifficultySchema.optional(),
    estimatedDuration: questDurationSchema.optional(),
    status: questStatusSchema.optional(),
    priority: questPrioritySchema.optional(),
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string().max(50)).optional(),
  });

  // Get all quests endpoint with pagination
  fastify.get('/quests', async (request, reply) => {
    try {
      const {
        userId,
        page = 1,
        limit = 20,
        status,
        priority,
        difficulty,
      } = request.query as {
        userId?: string;
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        difficulty?: string;
      };

      if (!userId) {
        return reply.code(400).send({
          success: false,
          error: 'userId query parameter is required',
        });
      }

      // Validate pagination parameters
      const validatedPage = Math.max(1, Math.floor(page));
      const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
      const offset = (validatedPage - 1) * validatedLimit;

      // Build where clause
      const whereClause: any = {
        userId: userId,
      };

      // Add optional filters
      if (status) {
        if (Object.values(QuestStatus).includes(status as any)) {
          whereClause.status = status;
        } else {
          return reply.send({
            success: true,
            data: [],
            pagination: {
              page: validatedPage,
              limit: validatedLimit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          });
        }
      }
      if (priority) {
        if (Object.values(QuestPriority).includes(priority as any)) {
          whereClause.priority = priority;
        } else {
          return reply.send({
            success: true,
            data: [],
            pagination: {
              page: validatedPage,
              limit: validatedLimit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          });
        }
      }
      if (difficulty) {
        if (Object.values(QuestDifficulty).includes(difficulty as any)) {
          whereClause.difficulty = difficulty;
        } else {
          return reply.send({
            success: true,
            data: [],
            pagination: {
              page: validatedPage,
              limit: validatedLimit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          });
        }
      }

      // Get total count for pagination
      const totalQuests = await prisma.quest.count({
        where: whereClause,
      });

      const quests = await prisma.quest.findMany({
        where: whereClause,
        include: {
          category: true,
          tags: true,
          steps: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: validatedLimit,
        skip: offset,
      });

      const totalPages = Math.ceil(totalQuests / validatedLimit);

      return reply.send({
        success: true,
        data: quests,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: totalQuests,
          totalPages,
          hasNext: validatedPage < totalPages,
          hasPrev: validatedPage > 1,
        },
      });
    } catch (err) {
      request.log.error({
        error: err,
        userId: (request.query as any).userId,
        operation: 'getQuests',
        query: request.query,
      });
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Get quest by ID endpoint
  fastify.get('/quests/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { userId } = request.query as { userId?: string };

      if (!userId) {
        return reply.code(400).send({
          success: false,
          error: 'userId query parameter is required',
        });
      }

      const quest = await prisma.quest.findFirst({
        where: {
          id: id,
          userId: userId,
        },
        include: {
          category: true,
          tags: true,
          steps: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      });

      if (!quest) {
        return reply.code(404).send({
          success: false,
          error: 'Quest not found',
        });
      }

      return reply.send({
        success: true,
        data: quest,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Create quest endpoint
  fastify.post('/quests', async (request, reply) => {
    try {
      const body = createQuestSchema.parse(request.body);
      const { userId } = request.query as { userId?: string };

      if (!userId) {
        return reply.code(400).send({
          success: false,
          error: 'userId query parameter is required',
        });
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
        });
      }

      // Verify category exists if provided
      if (body.categoryId) {
        const category = await prisma.questCategory.findFirst({
          where: {
            id: body.categoryId,
            userId: userId,
          },
        });

        if (!category) {
          return reply.code(404).send({
            success: false,
            error: 'Category not found',
          });
        }
      }

      // Create quest data
      const questData: any = {
        title: sanitizeInput(body.title),
        description: body.description ? sanitizeInput(body.description) : null,
        difficulty: body.difficulty,
        estimatedDuration: body.estimatedDuration,
        priority: body.priority,
        userId: userId,
        categoryId: body.categoryId || null,
      };

      // Add tags if provided
      if (body.tags && body.tags.length > 0) {
        questData.tags = {
          create: body.tags.map(tag => ({
            tagName: sanitizeInput(tag),
          })),
        };
      }

      const quest = await prisma.quest.create({
        data: questData,
        include: {
          category: true,
          tags: true,
          steps: true,
        },
      });

      return reply.code(201).send({
        success: true,
        data: quest,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: err.errors,
        });
      }

      request.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Update quest endpoint
  fastify.put('/quests/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateQuestSchema.parse(request.body);
      const { userId } = request.query as { userId?: string };

      if (!userId) {
        return reply.code(400).send({
          success: false,
          error: 'userId query parameter is required',
        });
      }

      // Check if quest exists and belongs to user
      const existingQuest = await prisma.quest.findFirst({
        where: {
          id: id,
          userId: userId,
        },
      });

      if (!existingQuest) {
        return reply.code(404).send({
          success: false,
          error: 'Quest not found',
        });
      }

      // Verify category exists if provided
      if (body.categoryId) {
        const category = await prisma.questCategory.findFirst({
          where: {
            id: body.categoryId,
            userId: userId,
          },
        });

        if (!category) {
          return reply.code(404).send({
            success: false,
            error: 'Category not found',
          });
        }
      }

      // Prepare update data
      const updateData: any = {};

      if (body.title !== undefined) {
        updateData.title = sanitizeInput(body.title);
      }
      if (body.description !== undefined) {
        updateData.description = body.description
          ? sanitizeInput(body.description)
          : null;
      }
      if (body.difficulty !== undefined) {
        updateData.difficulty = body.difficulty;
      }
      if (body.estimatedDuration !== undefined) {
        updateData.estimatedDuration = body.estimatedDuration;
      }
      if (body.status !== undefined) {
        updateData.status = body.status;
        if (body.status === 'COMPLETED' && !existingQuest.completedAt) {
          updateData.completedAt = new Date();
        }
      }
      if (body.priority !== undefined) {
        updateData.priority = body.priority;
      }
      if (body.categoryId !== undefined) {
        updateData.categoryId = body.categoryId || null;
      }

      // Update quest
      const updatedQuest = await prisma.quest.update({
        where: { id: id },
        data: updateData,
        include: {
          category: true,
          tags: true,
          steps: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      });

      // Update tags if provided
      if (body.tags !== undefined) {
        // Delete existing tags
        await prisma.questTag.deleteMany({
          where: { questId: id },
        });

        // Create new tags
        if (body.tags.length > 0) {
          await prisma.questTag.createMany({
            data: body.tags.map(tag => ({
              questId: id,
              tagName: sanitizeInput(tag),
            })),
          });
        }

        // Fetch updated quest with tags
        const questWithTags = await prisma.quest.findUnique({
          where: { id: id },
          include: {
            category: true,
            tags: true,
            steps: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        });

        return reply.send({
          success: true,
          data: questWithTags,
        });
      }

      return reply.send({
        success: true,
        data: updatedQuest,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: err.errors,
        });
      }

      request.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Delete quest endpoint
  fastify.delete('/quests/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { userId } = request.query as { userId?: string };

      if (!userId) {
        return reply.code(400).send({
          success: false,
          error: 'userId query parameter is required',
        });
      }

      // Check if quest exists and belongs to user
      const existingQuest = await prisma.quest.findFirst({
        where: {
          id: id,
          userId: userId,
        },
      });

      if (!existingQuest) {
        return reply.code(404).send({
          success: false,
          error: 'Quest not found',
        });
      }

      // Delete quest (cascade will handle related records)
      await prisma.quest.delete({
        where: { id: id },
      });

      return reply.send({
        success: true,
        message: 'Quest deleted successfully',
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
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
      // Check for existing email or username
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: body.email }, { username: body.username }],
        },
      });
      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User with this email or username already exists',
        });
      }
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
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: err.errors,
        });
      }
      request.log.error(err);
      return reply
        .code(500)
        .send({ success: false, error: 'Internal server error' });
    }
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
