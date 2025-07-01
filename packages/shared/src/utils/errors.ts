import {
  QuestlogError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '@questlog/types';

/**
 * Creates a standardized error response
 */
export const createErrorResponse = (
  message: string,
  code: string,
  statusCode: number = 500,
  field?: string
) => {
  return {
    success: false,
    error: {
      message,
      code,
      statusCode,
      field,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Creates a validation error
 */
export const createValidationError = (
  message: string,
  field?: string
): ValidationError => {
  return new ValidationError(message, field);
};

/**
 * Creates an authentication error
 */
export const createAuthenticationError = (
  message?: string
): AuthenticationError => {
  return new AuthenticationError(message);
};

/**
 * Creates an authorization error
 */
export const createAuthorizationError = (
  message?: string
): AuthorizationError => {
  return new AuthorizationError(message);
};

/**
 * Creates a not found error
 */
export const createNotFoundError = (
  resource: string,
  id?: string
): NotFoundError => {
  return new NotFoundError(resource, id);
};

/**
 * Checks if an error is a QuestlogError
 */
export const isQuestlogError = (error: unknown): error is QuestlogError => {
  return error instanceof Error && 'code' in error && 'statusCode' in error;
};

/**
 * Handles and formats errors for API responses
 */
export const handleError = (error: unknown) => {
  if (isQuestlogError(error)) {
    return createErrorResponse(
      error.message,
      error.code,
      error.statusCode,
      'field' in error ? (error as ValidationError).field : undefined
    );
  }

  // Handle unknown errors
  // console.error('Unhandled error:', error);
  return createErrorResponse(
    'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR',
    500
  );
};

/**
 * Logs errors with appropriate context
 */
export const logError = (error: unknown, context?: Record<string, unknown>) => {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // console.error('Error logged:', errorInfo);
  return errorInfo;
};
