/**
 * API Validation Schemas
 * 
 * Zod schemas for validating API request payloads.
 * These schemas ensure data integrity at API boundaries.
 * 
 * @module @roaddoggs/core/schemas/api
 */

import { z } from 'zod';
import { Budget, FuelType } from '../models/identity';

/**
 * Create Trip Schema
 * Validates payload for creating a new trip
 * 
 * @schema CreateTripSchema
 */
export const CreateTripSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  
  startDate: z
    .date()
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, {
      message: 'Start date must be today or later',
    }),
  
  endDate: z.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

/**
 * Invite User Schema
 * Validates payload for inviting a user to a trip
 * 
 * @schema InviteUserSchema
 */
export const InviteUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format'),
  
  role: z.enum(['EDITOR', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be EDITOR or VIEWER' }),
  }),
  
  tripId: z
    .string()
    .uuid('Invalid UUID format'),
});

/**
 * Update Profile Schema
 * Validates payload for updating user preferences
 * All fields are optional for partial updates
 * 
 * @schema UpdateProfileSchema
 */
export const UpdateProfileSchema = z.object({
  nature: z.boolean().optional(),
  
  culture: z.boolean().optional(),
  
  foodie: z.boolean().optional(),
  
  budget: z.nativeEnum(Budget).optional(),
  
  rvProfile: z.object({
    height: z.number().positive('Height must be positive'),
    weight: z.number().positive('Weight must be positive'),
    fuelType: z.nativeEnum(FuelType),
  }).nullable().optional(),
}).partial();

// Export TypeScript types inferred from schemas
export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
