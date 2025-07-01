import { z } from 'zod';
import { QuestDifficulty, QuestStatus, QuestPriority } from '@questlog/types';

/**
 * Validation schemas for common data types
 */
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

export const questTitleSchema = z
  .string()
  .min(1, 'Quest title is required')
  .max(255, 'Quest title must be at most 255 characters');

export const questDescriptionSchema = z
  .string()
  .max(1000, 'Quest description must be at most 1000 characters')
  .optional();

export const questDurationSchema = z
  .number()
  .min(1, 'Duration must be at least 1 minute')
  .max(1440, 'Duration must be at most 24 hours (1440 minutes)');

export const questDifficultySchema = z.nativeEnum(QuestDifficulty);

export const questStatusSchema = z.nativeEnum(QuestStatus);

export const questPrioritySchema = z.nativeEnum(QuestPriority);

/**
 * Validates an email address
 */
export const isValidEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a password
 */
export const isValidPassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a username
 */
export const isValidUsername = (username: string): boolean => {
  try {
    usernameSchema.parse(username);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates quest data
 */
export const validateQuestData = (data: unknown) => {
  const questSchema = z.object({
    title: questTitleSchema,
    description: questDescriptionSchema,
    difficulty: questDifficultySchema,
    estimatedDuration: questDurationSchema,
    priority: questPrioritySchema,
    tags: z.array(z.string()).optional(),
  });

  return questSchema.parse(data);
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

/**
 * Validates and sanitizes quest title
 */
export const validateAndSanitizeQuestTitle = (title: string): string => {
  const sanitized = sanitizeInput(title);
  questTitleSchema.parse(sanitized);
  return sanitized;
};
