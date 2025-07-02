import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../prisma';
import {
  questTitleSchema,
  questDescriptionSchema,
  questDurationSchema,
  questDifficultySchema,
  questStatusSchema,
  questPrioritySchema,
  sanitizeInput,
} from '@questlog/shared';
import { QuestPriority, QuestStatus, QuestDifficulty } from '@questlog/types';
import { ValidationError, NotFoundError } from '@questlog/shared';

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

// Query parameter schemas - userId is required and validated strictly
const questQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Separate schema for optional filters that should return empty results if invalid
const questFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
  status: z.string().optional(),
  priority: z.string().optional(),
  difficulty: z.string().optional(),
});

const questIdParamSchema = z.object({
  id: z.string().uuid('Invalid quest ID'),
});

// Helper functions
const validateUserExists = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User', userId);
  }
};

const validateCategoryExists = async (categoryId: string, userId: string): Promise<void> => {
  const category = await prisma.questCategory.findFirst({
    where: {
      id: categoryId,
      userId: userId,
    },
  });

  if (!category) {
    throw new NotFoundError('Category', categoryId);
  }
};

const buildWhereClause = (userId: string, filters: {
  status?: QuestStatus;
  priority?: QuestPriority;
  difficulty?: QuestDifficulty;
}) => {
  const whereClause: {
    userId: string;
    status?: QuestStatus;
    priority?: QuestPriority;
    difficulty?: QuestDifficulty;
  } = {
    userId,
  };

  if (filters.status !== undefined) whereClause.status = filters.status;
  if (filters.priority !== undefined) whereClause.priority = filters.priority;
  if (filters.difficulty !== undefined) whereClause.difficulty = filters.difficulty;

  return whereClause;
};

const createPaginationResponse = (data: any[], page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Route handlers
export const registerQuestRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Get all quests endpoint with pagination
  fastify.get('/quests', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate required userId first
      let userId: string;
      try {
        userId = questQuerySchema.parse(request.query).userId as string;
      } catch {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      // Parse filters
      const filters = questFiltersSchema.safeParse(request.query);
      let { page, limit, status, priority, difficulty } = filters.success ? filters.data : {
        page: 1,
        limit: 20,
        status: undefined,
        priority: undefined,
        difficulty: undefined,
      };
      
      // Handle limit capping - if Zod failed to parse, try to get limit from raw query
      if (!filters.success && (request.query as any).limit) {
        const rawLimit = Number((request.query as any).limit);
        if (!isNaN(rawLimit) && rawLimit > 0) {
          limit = Math.min(rawLimit, 100);
        }
      } else {
        // Always cap limit at 100
        limit = Math.min(limit, 100);
      }
      const offset = (page - 1) * limit;
      // For non-existent filter values, set a flag to return empty results
      let invalidFilter = false;
      const validStatus = status
        ? Object.values(QuestStatus).includes(status as QuestStatus)
          ? (status as QuestStatus)
          : (invalidFilter = true, undefined)
        : undefined;
      const validPriority = priority
        ? Object.values(QuestPriority).includes(priority as QuestPriority)
          ? (priority as QuestPriority)
          : (invalidFilter = true, undefined)
        : undefined;
      const validDifficulty = difficulty
        ? Object.values(QuestDifficulty).includes(difficulty as QuestDifficulty)
          ? (difficulty as QuestDifficulty)
          : (invalidFilter = true, undefined)
        : undefined;
      if (invalidFilter) {
        return reply.send(createPaginationResponse([], page, limit, 0));
      }
      const whereClause = buildWhereClause(userId, {
        ...(validStatus && { status: validStatus }),
        ...(validPriority && { priority: validPriority }),
        ...(validDifficulty && { difficulty: validDifficulty })
      });
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
        take: limit,
        skip: offset,
      });
      return reply.send(createPaginationResponse(quests, page, limit, totalQuests));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      throw error;
    }
  });

  // Get quest by ID endpoint
  fastify.get('/quests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: rawId } = questIdParamSchema.parse(request.params);
      const id: string = String(rawId);
      let userId: string;
      try {
        userId = String(questQuerySchema.parse(request.query).userId);
      } catch {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      const quest = await prisma.quest.findFirst({
        where: {
          id: String(id),
          userId,
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
        throw new NotFoundError('Quest', id);
      }
      return reply.send({
        success: true,
        data: quest,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      throw error;
    }
  });

  // Create quest endpoint
  fastify.post('/quests', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let body;
      try {
        body = createQuestSchema.parse(request.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const field = error.errors[0]?.path[0];
          throw new ValidationError('Invalid request body', field ? String(field) : undefined);
        }
        throw error;
      }
      let userId: string;
      try {
        userId = questQuerySchema.parse(request.query).userId as string;
      } catch {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      await validateUserExists(userId);
      if (body.categoryId) {
        await validateCategoryExists(String(body.categoryId), userId);
      }
      // Create quest data
      const questData = {
        title: sanitizeInput(body.title),
        description: body.description ? sanitizeInput(body.description) : null,
        difficulty: body.difficulty,
        estimatedDuration: body.estimatedDuration,
        priority: body.priority,
        userId,
        categoryId: body.categoryId || null,
      };
      // Add tags if provided
      const quest = await prisma.quest.create({
        data: body.tags && body.tags.length > 0
          ? {
              ...questData,
              tags: {
                create: body.tags.map(tag => ({
                  tagName: sanitizeInput(tag),
                })),
              },
            }
          : questData,
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
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      throw error;
    }
  });

  // Update quest endpoint
  fastify.put('/quests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: rawId } = questIdParamSchema.parse(request.params);
      const id: string = String(rawId);
      let body;
      try {
        body = updateQuestSchema.parse(request.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const field = error.errors[0]?.path[0];
          throw new ValidationError('Invalid request body', field ? String(field) : undefined);
        }
        throw error;
      }
      let userId: string;
      try {
        userId = String(questQuerySchema.parse(request.query).userId);
      } catch {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      // Check if quest exists and belongs to user
      const existingQuest = await prisma.quest.findFirst({
        where: {
          id,
          userId,
        },
      });
      if (!existingQuest) {
        throw new NotFoundError('Quest', id);
      }
      if (body.categoryId) {
        await validateCategoryExists(String(body.categoryId), userId);
      }
      // Prepare update data
      const updateData: Record<string, any> = {};
      if (body.title !== undefined) {
        updateData['title'] = sanitizeInput(body.title);
      }
      if (body.description !== undefined) {
        updateData['description'] = body.description
          ? sanitizeInput(body.description)
          : null;
      }
      if (body.difficulty !== undefined) {
        updateData['difficulty'] = body.difficulty;
      }
      if (body.estimatedDuration !== undefined) {
        updateData['estimatedDuration'] = body.estimatedDuration;
      }
      if (body.status !== undefined) {
        updateData['status'] = body.status;
        if (body.status === 'COMPLETED' && !existingQuest.completedAt) {
          updateData['completedAt'] = new Date();
        }
      }
      if (body.priority !== undefined) {
        updateData['priority'] = body.priority;
      }
      if (body.categoryId !== undefined) {
        updateData['categoryId'] = body.categoryId;
      }
      if (body.tags !== undefined) {
        // Remove existing tags and add new ones
        await prisma.questTag.deleteMany({ where: { questId: id } });
        updateData['tags'] = {
          create: body.tags.map(tag => ({ tagName: sanitizeInput(tag) })),
        };
      }
      const updatedQuest = await prisma.quest.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          tags: true,
          steps: true,
        },
      });
      return reply.send({
        success: true,
        data: updatedQuest,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      throw error;
    }
  });

  // Delete quest endpoint
  fastify.delete('/quests/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: rawId } = questIdParamSchema.parse(request.params);
      const id: string = String(rawId);
      let userId: string;
      try {
        userId = String(questQuerySchema.parse(request.query).userId);
      } catch {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      // Check if quest exists and belongs to user
      const existingQuest = await prisma.quest.findFirst({
        where: {
          id,
          userId,
        },
      });
      if (!existingQuest) {
        throw new NotFoundError('Quest', id);
      }
      await prisma.quest.delete({
        where: { id },
      });
      return reply.send({
        success: true,
        message: 'Quest deleted successfully',
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', 'userId');
      }
      throw error;
    }
  });
}; 