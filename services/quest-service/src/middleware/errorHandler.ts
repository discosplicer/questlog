import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { QuestlogError, ValidationError } from '@questlog/shared';

export const registerErrorHandler = (fastify: FastifyInstance): void => {
  fastify.setErrorHandler((error, request, reply) => {
    // Log the error for debugging
    request.log.error({
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      userId: (request.query as any)?.userId || 'unknown',
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
    }

    // Handle custom Questlog errors
    if (error instanceof QuestlogError) {
      return reply.code(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && { field: error.field }),
        },
      });
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return reply.code(409).send({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this information already exists',
        },
      });
    }

    if (error.code === 'P2025') {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
        },
      });
    }

    // Handle generic errors
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        ...(process.env['NODE_ENV'] === 'development' && { details: error.message }),
      },
    });
  });
}; 