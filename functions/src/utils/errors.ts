/**
 * Error handling utilities
 * Standardized error responses for API endpoints
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  REAUTH_REQUIRED: 'REAUTH_REQUIRED',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  ALREADY_DELETED: 'ALREADY_DELETED',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;
