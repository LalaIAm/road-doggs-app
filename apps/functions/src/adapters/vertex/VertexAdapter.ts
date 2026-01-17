/**
 * Vertex AI Adapter
 * 
 * Wrapper for the Vertex AI SDK to handle authentication and model invocation.
 * Provides a clean interface for generating content using Google's Vertex AI (Gemini).
 * 
 * Per TRD-5: Generative Intelligence (Vertex AI)
 * Per TRD-262: If Vertex AI returns a 500 error, the service must retry once
 * 
 * @module apps/functions/src/adapters/vertex/VertexAdapter
 */

import { VertexAI } from '@google-cloud/vertexai';

/**
 * Configuration for Vertex AI adapter
 */
export interface VertexAdapterConfig {
  projectId: string;
  location?: string;
  model?: string;
}

/**
 * Options for generating content
 */
export interface GenerateContentOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

/**
 * Response from Vertex AI
 */
export interface VertexResponse {
  text: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Vertex AI Adapter class
 * 
 * Encapsulates Vertex AI SDK calls and provides error handling and retry logic.
 */
export class VertexAdapter {
  private vertexAI: VertexAI;
  private model: string;
  private location: string;

  /**
   * Initialize Vertex AI adapter
   * 
   * @param config - Configuration object with projectId, location, and model
   */
  constructor(config: VertexAdapterConfig) {
    const {
      projectId,
      location = 'us-central1',
      model = 'gemini-1.5-flash',
    } = config;

    if (!projectId) {
      throw new Error('VertexAdapter: projectId is required');
    }

    this.location = location;
    this.model = model;

    // Initialize Vertex AI client
    this.vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
  }

  /**
   * Generate content from a prompt
   * 
   * Per TRD-262: If Vertex AI returns a 500 error, the service must retry once
   * 
   * @param prompt - The prompt text to send to the model
   * @param options - Optional generation parameters (temperature, maxOutputTokens, etc.)
   * @returns Promise resolving to the response text and metadata
   * @throws Error if generation fails after retry
   */
  async generateContent(
    prompt: string,
    options: GenerateContentOptions = {}
  ): Promise<VertexResponse> {
    try {
      return await this._generateContentInternal(prompt, options);
    } catch (error: any) {
      // Per TRD-262: Retry once on 500 errors
      if (this._isRetryableError(error)) {
        console.warn('[VertexAdapter] Retrying after 500 error:', error.message);
        try {
          return await this._generateContentInternal(prompt, options);
        } catch (retryError: any) {
          throw this._formatError(retryError, 'Retry failed');
        }
      }
      throw this._formatError(error, 'Generation failed');
    }
  }

  /**
   * Internal method to generate content (without retry logic)
   * 
   * @param prompt - The prompt text
   * @param options - Generation options
   * @returns Promise resolving to the response
   */
  private async _generateContentInternal(
    prompt: string,
    options: GenerateContentOptions
  ): Promise<VertexResponse> {
    // Get the generative model
    const generativeModel = this.vertexAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        topP: options.topP,
        topK: options.topK,
      },
    });

    // Generate content
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;

    // Extract text content
    // Note: response.text() is available but TypeScript types may not reflect it
    const text = (response as any).text();

    // Extract usage metadata if available
    const usageMetadata = 'usageMetadata' in response
      ? (response as any).usageMetadata
      : undefined;

    return {
      text,
      usageMetadata: usageMetadata ? {
        promptTokenCount: usageMetadata.promptTokenCount,
        candidatesTokenCount: usageMetadata.candidatesTokenCount,
        totalTokenCount: usageMetadata.totalTokenCount,
      } : undefined,
    };
  }

  /**
   * Check if an error is retryable (500 status code)
   * 
   * @param error - The error object
   * @returns true if the error is retryable
   */
  private _isRetryableError(error: any): boolean {
    // Check for HTTP 500 status code
    if (error.status === 500 || error.statusCode === 500) {
      return true;
    }

    // Check for gRPC error code 13 (INTERNAL) or 14 (UNAVAILABLE)
    if (error.code === 13 || error.code === 14) {
      return true;
    }

    // Check error message for 500-related strings
    const message = error.message?.toLowerCase() || '';
    if (message.includes('500') || message.includes('internal server error')) {
      return true;
    }

    return false;
  }

  /**
   * Format error for consistent error handling
   * 
   * @param error - The error object
   * @param context - Context message
   * @returns Formatted error
   */
  private _formatError(error: any, context: string): Error {
    const message = error.message || 'Unknown error';
    const code = error.code || error.status || error.statusCode;
    
    const formattedError = new Error(
      `VertexAdapter ${context}: ${message}${code ? ` (code: ${code})` : ''}`
    );
    
    // Preserve original error properties
    if (error.stack) {
      formattedError.stack = error.stack;
    }
    
    return formattedError;
  }

  /**
   * Get the configured model name
   * 
   * @returns The model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the configured location
   * 
   * @returns The location
   */
  getLocation(): string {
    return this.location;
  }
}

/**
 * Create a VertexAdapter instance from environment variables
 * 
 * Uses VERTEX_AI_PROJECT_ID and VERTEX_AI_LOCATION from environment.
 * 
 * @param overrides - Optional configuration overrides
 * @returns VertexAdapter instance
 */
export function createVertexAdapter(overrides?: Partial<VertexAdapterConfig>): VertexAdapter {
  const projectId = process.env.VERTEX_AI_PROJECT_ID || overrides?.projectId;
  
  if (!projectId) {
    throw new Error(
      'VertexAdapter: VERTEX_AI_PROJECT_ID environment variable is required'
    );
  }

  return new VertexAdapter({
    projectId,
    location: process.env.VERTEX_AI_LOCATION || overrides?.location || 'us-central1',
    model: overrides?.model || 'gemini-1.5-flash',
  });
}
