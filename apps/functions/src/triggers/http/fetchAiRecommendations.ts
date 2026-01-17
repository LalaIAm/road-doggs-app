/**
 * HTTP Trigger: fetchAiRecommendations
 * 
 * Orchestrates PromptBuilder, VertexAdapter, and JsonRepair to generate
 * AI-powered POI recommendations based on user preferences and route context.
 * 
 * Per TRD-276: Protocol: AI Recommendation
 * Per TRD-257-260: Prompt Engineering
 * Per TRD-262: Retry on 500 errors (handled by VertexAdapter)
 * Per TRD-263: JSON repair on malformed responses
 * Per TRD-264: Return 422 if repair fails
 * 
 * @module apps/functions/src/triggers/http/fetchAiRecommendations
 */

import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import { verifyToken, AuthenticatedRequest } from '../../utils/auth';
import { PromptBuilder } from '../../services/intelligence/PromptBuilder';
import { createVertexAdapter } from '../../adapters/vertex/VertexAdapter';
import { repair } from '../../services/intelligence/JsonRepair';
import { UserPreferences } from '@roaddoggs/core';
import { AiPoiResponseSchema, AiRecommendation } from '@roaddoggs/core';

/**
 * Request body interface for fetchAiRecommendations
 */
interface FetchAiRecommendationsRequest {
  preferences: UserPreferences;
  routeContext?: string;
}

/**
 * Response interface for fetchAiRecommendations
 */
interface FetchAiRecommendationsResponse {
  recommendations: AiRecommendation[];
}

/**
 * HTTP Cloud Function for fetching AI recommendations
 * 
 * POST /fetchAiRecommendations
 * 
 * Request Body:
 * {
 *   preferences: UserPreferences,
 *   routeContext?: string
 * }
 * 
 * Response:
 * {
 *   recommendations: AiRecommendation[]
 * }
 */
export const fetchAiRecommendations = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 60, // Per TRD-37: HTTP-triggered functions have 60s timeout
    memory: '1GB',
  })
  .https.onRequest(async (req: Request, res: Response) => {
    // Verify authentication
    await new Promise<void>((resolve) => {
      verifyToken(req as AuthenticatedRequest, res, () => resolve());
    });

    const authReq = req as AuthenticatedRequest;
    if (!authReq.uid) {
      return; // Response already sent by verifyToken
    }

    try {
      // Validate request method
      if (authReq.method !== 'POST') {
        res.status(405).json({
          error: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed',
        });
        return;
      }

      // Validate request body
      const body = authReq.body as FetchAiRecommendationsRequest;
      
      if (!body || !body.preferences) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Request body must include preferences',
        });
        return;
      }

      // Validate preferences structure
      if (
        typeof body.preferences.nature !== 'boolean' ||
        typeof body.preferences.culture !== 'boolean' ||
        typeof body.preferences.foodie !== 'boolean' ||
        !body.preferences.budget
      ) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Invalid preferences structure',
        });
        return;
      }

      functions.logger.info('[fetchAiRecommendations] Processing request', {
        uid: authReq.uid,
        preferences: body.preferences,
      });

      // Step 1: Build prompt using PromptBuilder
      const promptBuilder = new PromptBuilder();
      const prompt = promptBuilder.buildPrompt(
        body.preferences,
        body.routeContext
      );

      // Step 2: Generate content using VertexAdapter
      const vertexAdapter = createVertexAdapter();
      const vertexResponse = await vertexAdapter.generateContent(prompt);

      functions.logger.info('[fetchAiRecommendations] Vertex AI response received', {
        textLength: vertexResponse.text.length,
        usageMetadata: vertexResponse.usageMetadata,
      });

      // Step 3: Repair JSON if malformed (per TRD-263)
      const repairResult = repair(vertexResponse.text);

      if (!repairResult.success || !repairResult.json) {
        functions.logger.error('[fetchAiRecommendations] JSON repair failed', {
          error: repairResult.error,
          originalText: vertexResponse.text.substring(0, 200), // Log first 200 chars
        });

        // Per TRD-264: Return 422 if repair fails
        res.status(422).json({
          error: 'UNPROCESSABLE_ENTITY',
          message: 'Failed to parse AI response',
          details: repairResult.error,
        });
        return;
      }

      // Step 4: Parse repaired JSON
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(repairResult.json);
      } catch (parseError: any) {
        functions.logger.error('[fetchAiRecommendations] JSON parse failed after repair', {
          error: parseError.message,
          repairedJson: repairResult.json.substring(0, 200),
        });

        res.status(422).json({
          error: 'UNPROCESSABLE_ENTITY',
          message: 'Failed to parse repaired JSON',
          details: parseError.message,
        });
        return;
      }

      // Step 5: Validate and map response schema
      // AI returns: [{ name, description, lat, lng, category, reason }]
      // Schema expects: [{ name, description, latitude, longitude, category, reason }]
      if (!Array.isArray(parsedResponse)) {
        res.status(422).json({
          error: 'UNPROCESSABLE_ENTITY',
          message: 'AI response must be an array',
        });
        return;
      }

      // Map lat/lng to latitude/longitude and validate
      const mappedRecommendations = parsedResponse.map((item: any) => {
        // Map lat → latitude, lng → longitude
        if (item.lat !== undefined && item.latitude === undefined) {
          item.latitude = item.lat;
          delete item.lat;
        }
        if (item.lng !== undefined && item.longitude === undefined) {
          item.longitude = item.lng;
          delete item.lng;
        }
        return item;
      });

      // Validate against schema
      const validationResult = AiPoiResponseSchema.safeParse(mappedRecommendations);

      if (!validationResult.success) {
        functions.logger.error('[fetchAiRecommendations] Schema validation failed', {
          errors: validationResult.error.errors,
          recommendations: mappedRecommendations,
        });

        res.status(422).json({
          error: 'UNPROCESSABLE_ENTITY',
          message: 'AI response does not match expected schema',
          details: validationResult.error.errors,
        });
        return;
      }

      // Step 6: Return successful response
      const response: FetchAiRecommendationsResponse = {
        recommendations: validationResult.data,
      };

      functions.logger.info('[fetchAiRecommendations] Success', {
        recommendationCount: response.recommendations.length,
      });

      res.status(200).json(response);
    } catch (error: any) {
      functions.logger.error('[fetchAiRecommendations] Unexpected error', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing the request',
      });
    }
  });
