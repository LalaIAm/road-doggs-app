/**
 * AI Response Validation Schemas
 * 
 * Strict Zod schemas for validating AI/LLM response payloads.
 * These schemas ensure LLM outputs conform to expected structure.
 * 
 * @module @roaddoggs/core/schemas/ai
 */

import { z } from 'zod';

/**
 * AI Recommendation Schema
 * Validates a single POI recommendation from AI/LLM
 * 
 * @schema AiRecommendationSchema
 */
export const AiRecommendationSchema = z.object({
  /** POI name */
  name: z.string().min(1, 'Name is required'),
  
  /** Description of the POI */
  description: z.string().min(1, 'Description is required'),
  
  /** Latitude coordinate (-90 to 90) */
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  
  /** Longitude coordinate (-180 to 180) */
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  
  /** Category/type of the POI */
  category: z.string().min(1, 'Category is required'),
  
  /** Explanation of why this POI fits the user context */
  reason: z.string().min(1, 'Reason is required'),
});

/**
 * AI POI Response Schema
 * Validates the complete AI response containing an array of recommendations
 * 
 * @schema AiPoiResponseSchema
 */
export const AiPoiResponseSchema = z.array(AiRecommendationSchema);

// Export TypeScript types inferred from schemas
export type AiRecommendation = z.infer<typeof AiRecommendationSchema>;
export type AiPoiResponse = z.infer<typeof AiPoiResponseSchema>;
