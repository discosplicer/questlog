import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../prisma';
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from '@questlog/shared';
import { ValidationError } from '@questlog/shared';
import bcrypt from 'bcryptjs';
import { config as appConfig } from '../config/environment';

// User validation schemas
const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  displayName: z.string().max(100).optional(),
});

// Route handlers
export const registerUserRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // User registration endpoint
  fastify.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request body', error.errors[0]?.path.join('.'));
      }
      throw error;
    }
  });
}; 