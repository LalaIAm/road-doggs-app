/**
 * Google Maps API Adapter
 * 
 * Wrapper for Google Maps Platform APIs using Axios.
 * Handles authentication, error handling, and rate limiting.
 * 
 * Per TRD-266: MapsAdapter
 * Per TRD-267: Encapsulates axios calls to https://maps.googleapis.com
 * Per TRD-268: Injects key=${process.env.GOOGLE_MAPS_SERVER_KEY}
 * Per TRD-269: Implements retry logic for 429 (Rate Limit) errors
 * 
 * @module apps/functions/src/adapters/maps/MapsAdapter
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Configuration for Maps Adapter
 */
export interface MapsAdapterConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Google Maps API response (generic)
 */
export interface MapsApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Maps Adapter class
 * 
 * Encapsulates Google Maps API calls with automatic API key injection
 * and retry logic for rate limit errors.
 */
export class MapsAdapter {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Initialize Maps Adapter
   * 
   * @param config - Configuration object with API key and optional settings
   */
  constructor(config: MapsAdapterConfig) {
    const {
      apiKey,
      baseURL = 'https://maps.googleapis.com',
      maxRetries = 3,
      retryDelay = 1000, // 1 second default delay
    } = config;

    if (!apiKey) {
      throw new Error('MapsAdapter: apiKey is required');
    }

    this.apiKey = apiKey;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;

    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Make a GET request to Google Maps API
   * 
   * Automatically injects API key as query parameter.
   * Implements retry logic for 429 (Rate Limit) errors per TRD-269.
   * 
   * @param endpoint - API endpoint path (e.g., '/maps/api/geocode/json')
   * @param params - Query parameters (API key will be automatically added)
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the API response
   * @throws Error if request fails after retries
   */
  async get<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    config: AxiosRequestConfig = {}
  ): Promise<MapsApiResponse<T>> {
    // Per TRD-268: Inject API key
    const paramsWithKey = {
      ...params,
      key: this.apiKey,
    };

    return this._requestWithRetry<T>(
      () => this.axiosInstance.get<T>(endpoint, { ...config, params: paramsWithKey }),
      endpoint
    );
  }

  /**
   * Make a POST request to Google Maps API
   * 
   * Automatically injects API key as query parameter.
   * Implements retry logic for 429 (Rate Limit) errors per TRD-269.
   * 
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param params - Query parameters (API key will be automatically added)
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the API response
   * @throws Error if request fails after retries
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    params: Record<string, any> = {},
    config: AxiosRequestConfig = {}
  ): Promise<MapsApiResponse<T>> {
    // Per TRD-268: Inject API key
    const paramsWithKey = {
      ...params,
      key: this.apiKey,
    };

    return this._requestWithRetry<T>(
      () => this.axiosInstance.post<T>(endpoint, data, { ...config, params: paramsWithKey }),
      endpoint
    );
  }

  /**
   * Internal method to execute request with retry logic
   * 
   * Per TRD-269: Implements retry logic for 429 (Rate Limit) errors
   * 
   * @param requestFn - Function that returns the axios request promise
   * @param endpoint - Endpoint path for logging
   * @returns Promise resolving to the API response
   */
  private async _requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    endpoint: string
  ): Promise<MapsApiResponse<T>> {
    let lastError: AxiosError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error: any) {
        lastError = error as AxiosError;

        // Per TRD-269: Retry on 429 (Rate Limit) errors
        if (this._isRateLimitError(error) && attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          
          console.warn(`[MapsAdapter] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
            endpoint,
            status: error.response?.status,
          });

          await this._sleep(delay);
          continue;
        }

        // If not a rate limit error, or max retries reached, throw
        throw this._formatError(error, endpoint);
      }
    }

    // Should never reach here, but TypeScript requires it
    throw this._formatError(lastError || new Error('Unknown error'), endpoint);
  }

  /**
   * Check if error is a rate limit error (429)
   * 
   * @param error - The error object
   * @returns true if the error is a 429 rate limit error
   */
  private _isRateLimitError(error: any): boolean {
    if (error.response) {
      return error.response.status === 429;
    }

    // Check error message for rate limit indicators
    const message = error.message?.toLowerCase() || '';
    return message.includes('rate limit') || message.includes('429');
  }

  /**
   * Format error for consistent error handling
   * 
   * @param error - The error object
   * @param endpoint - The endpoint that failed
   * @returns Formatted error
   */
  private _formatError(error: any, endpoint: string): Error {
    const message = error.message || 'Unknown error';
    const status = error.response?.status || error.status;
    const statusText = error.response?.statusText || error.statusText;

    const formattedError = new Error(
      `MapsAdapter request failed: ${message}${status ? ` (${status} ${statusText})` : ''} - ${endpoint}`
    );

    // Preserve original error properties
    if (error.response?.data) {
      (formattedError as any).responseData = error.response.data;
    }
    if (error.stack) {
      formattedError.stack = error.stack;
    }

    return formattedError;
  }

  /**
   * Sleep utility for retry delays
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the configured API key (without exposing it)
   * 
   * @returns Whether API key is configured (true/false)
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

/**
 * Create a MapsAdapter instance from environment variables
 * 
 * Uses GOOGLE_MAPS_SERVER_KEY from environment.
 * 
 * @param overrides - Optional configuration overrides
 * @returns MapsAdapter instance
 */
export function createMapsAdapter(overrides?: Partial<MapsAdapterConfig>): MapsAdapter {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || overrides?.apiKey;
  
  if (!apiKey) {
    throw new Error(
      'MapsAdapter: GOOGLE_MAPS_SERVER_KEY environment variable is required'
    );
  }

  return new MapsAdapter({
    apiKey,
    baseURL: overrides?.baseURL || 'https://maps.googleapis.com',
    maxRetries: overrides?.maxRetries || 3,
    retryDelay: overrides?.retryDelay || 1000,
  });
}
