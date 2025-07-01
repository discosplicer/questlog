// API Constants
export const API_BASE_URL =
  process.env['API_BASE_URL'] || 'http://localhost:3000';
export const API_VERSION = 'v1';

// Pagination Constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Quest Constants
export const MAX_QUEST_TITLE_LENGTH = 255;
export const MAX_QUEST_DESCRIPTION_LENGTH = 1000;
export const MAX_QUEST_DURATION_MINUTES = 1440; // 24 hours
export const MIN_QUEST_DURATION_MINUTES = 1;

// User Constants
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// Experience Points Constants
export const XP_PER_LEVEL = 1000;
export const XP_MULTIPLIER_PER_LEVEL = 1.2;

// Quest Difficulty XP Multipliers
export const XP_MULTIPLIERS = {
  EASY: 1,
  MEDIUM: 1.5,
  HARD: 2.5,
  EPIC: 5,
} as const;

// Time Constants
export const MILLISECONDS_PER_MINUTE = 60 * 1000;
export const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
export const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

// Cache Constants
export const CACHE_TTL = {
  QUEST: 5 * 60, // 5 minutes
  USER: 10 * 60, // 10 minutes
  CATEGORY: 30 * 60, // 30 minutes
} as const;

// JWT Constants
export const JWT_ACCESS_TOKEN_EXPIRY = '15m';
export const JWT_REFRESH_TOKEN_EXPIRY = '7d';

// Rate Limiting Constants
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // requests per window
} as const;

// File Upload Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Notification Constants
export const NOTIFICATION_TYPES = {
  QUEST_COMPLETED: 'quest_completed',
  QUEST_DUE_SOON: 'quest_due_soon',
  LEVEL_UP: 'level_up',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
} as const;

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Validation error occurred',
  AUTHENTICATION_ERROR: 'Authentication required',
  AUTHORIZATION_ERROR: 'Insufficient permissions',
  NOT_FOUND_ERROR: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_ALREADY_EXISTS: 'User already exists',
  QUEST_NOT_FOUND: 'Quest not found',
  CATEGORY_NOT_FOUND: 'Category not found',
} as const;
