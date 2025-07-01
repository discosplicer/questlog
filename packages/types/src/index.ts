// Core Quest Types
export interface Quest {
  id: string;
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  userId: string;
  categoryId?: string;
  tags: string[];
  priority: QuestPriority;
  experiencePoints: number;
  steps: QuestStep[];
}

export interface QuestStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  order: number;
  questId: string;
}

export interface QuestCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level: number;
  experiencePoints: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  gamification: GamificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'never';
}

export interface GamificationSettings {
  showProgress: boolean;
  showLevel: boolean;
  showAchievements: boolean;
  soundEffects: boolean;
}

// Enums
export enum QuestDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EPIC = 'EPIC',
}

export enum QuestStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request/Response Types
export interface CreateQuestRequest {
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  estimatedDuration: number;
  categoryId?: string;
  tags?: string[];
  priority: QuestPriority;
  steps?: Omit<QuestStep, 'id' | 'questId' | 'completed'>[];
}

export interface UpdateQuestRequest {
  title?: string;
  description?: string;
  difficulty?: QuestDifficulty;
  estimatedDuration?: number;
  status?: QuestStatus;
  categoryId?: string;
  tags?: string[];
  priority?: QuestPriority;
  steps?: QuestStep[];
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// AI Types
export interface QuestPrioritizationRequest {
  quests: Quest[];
  userPreferences: UserPreferences;
  availableTime: number; // in minutes
  context?: string;
}

export interface QuestPrioritizationResponse {
  prioritizedQuests: Quest[];
  reasoning: string;
  suggestedTimeAllocation: Record<string, number>; // questId -> minutes
}

export interface QuestBreakdownRequest {
  quest: Quest;
  userLevel: number;
  availableTime: number;
}

export interface QuestBreakdownResponse {
  steps: QuestStep[];
  estimatedTimePerStep: Record<string, number>;
  difficultyAdjustments: string[];
}

// Error Types
export class QuestlogError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'QuestlogError';
  }
}

export class ValidationError extends QuestlogError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends QuestlogError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends QuestlogError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends QuestlogError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}
