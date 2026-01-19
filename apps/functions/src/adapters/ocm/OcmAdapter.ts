/**
 * Open Charge Map (OCM) API Adapter
 * 
 * Wrapper for Open Charge Map API to query EV charging stations.
 * Handles authentication, error handling, and rate limiting.
 * 
 * Per TRD-122: Open Charge Map provides EV station data
 * Per PRDRDOGG-97: The system must allow filtering for EV charging stations by connector type
 * Per PRDRDOGG-141: EV Charging & Gas Station integration
 * 
 * @module apps/functions/src/adapters/ocm/OcmAdapter
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * Configuration for OCM Adapter
 */
export interface OcmAdapterConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * OCM API response (generic)
 */
export interface OcmApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Options for searching charging points
 */
export interface SearchChargingPointsOptions {
  latitude: number;
  longitude: number;
  distance?: number; // Distance in km (default: 10)
  maxResults?: number; // Maximum number of results (default: 50)
  connectionTypeId?: number; // Filter by connector type (Per PRDRDOGG-97)
  operatorId?: number;
  statusId?: number;
  countryCode?: string;
  compact?: boolean; // Return IDs instead of full reference details
  verbose?: boolean; // Include null fields
  output?: 'json' | 'xml'; // Default: json
}

/**
 * Charging Point (POI) data structure
 */
export interface ChargingPoint {
  ID: number;
  UUID: string;
  AddressInfo: {
    ID: number;
    Title: string;
    AddressLine1?: string;
    AddressLine2?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    CountryID: number;
    Country: {
      ISOCode: string;
      Title: string;
    };
    Latitude: number;
    Longitude: number;
    Distance?: number;
    DistanceUnit?: number;
  };
  Connections?: Array<{
    ID: number;
    ConnectionTypeID: number;
    ConnectionType: {
      ID: number;
      Title: string;
      FormalName?: string;
    };
    StatusTypeID: number;
    StatusType: {
      ID: number;
      Title: string;
      IsOperational: boolean;
    };
    LevelID?: number;
    Level?: {
      ID: number;
      Title: string;
      Comments?: string;
    };
    Amps?: number;
    Voltage?: number;
    PowerKW?: number;
    CurrentTypeID?: number;
    CurrentType?: {
      ID: number;
      Title: string;
    };
  }>;
  NumberOfPoints?: number;
  GeneralComments?: string;
  DatePlanned?: string;
  StatusTypeID?: number;
  StatusType?: {
    ID: number;
    Title: string;
    IsOperational: boolean;
  };
  DateLastStatusUpdate?: string;
  DataQualityLevel?: number;
  DateCreated?: string;
  SubmissionStatusTypeID?: number;
}

/**
 * OCM Adapter class
 * 
 * Encapsulates Open Charge Map API calls with automatic API key injection
 * and retry logic for rate limit errors.
 */
export class OcmAdapter {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Initialize OCM Adapter
   * 
   * @param config - Configuration object with API key and optional settings
   */
  constructor(config: OcmAdapterConfig) {
    const {
      apiKey,
      baseURL = 'https://api.openchargemap.io/v3',
      maxRetries = 3,
      retryDelay = 1000, // 1 second default delay
    } = config;

    if (!apiKey) {
      throw new Error('OcmAdapter: apiKey is required');
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
        'X-API-Key': apiKey, // Use header for API key
      },
    });
  }

  /**
   * Search for charging points near a location
   * 
   * Per PRDRDOGG-97: Supports filtering by connector type
   * 
   * @param options - Search options including location and filters
   * @returns Promise resolving to array of charging points
   */
  async searchChargingPoints(
    options: SearchChargingPointsOptions
  ): Promise<ChargingPoint[]> {
    const {
      latitude,
      longitude,
      distance = 10, // Default 10km
      maxResults = 50,
      connectionTypeId,
      operatorId,
      statusId,
      countryCode,
      compact = false,
      verbose = false,
      output = 'json',
    } = options;

    // Build query parameters
    const params: Record<string, any> = {
      latitude,
      longitude,
      distance,
      maxresults: maxResults,
      output,
    };

    // Add optional filters
    if (connectionTypeId) {
      params.connectiontypeid = connectionTypeId;
    }
    if (operatorId) {
      params.operatorid = operatorId;
    }
    if (statusId) {
      params.statusid = statusId;
    }
    if (countryCode) {
      params.countrycode = countryCode;
    }
    if (compact) {
      params.compact = 'true';
    }
    if (!verbose) {
      params.verbose = 'false';
    }

    // Add API key as query parameter (backup method)
    params.key = this.apiKey;

    const response = await this._requestWithRetry<ChargingPoint[]>(
      () => this.axiosInstance.get<ChargingPoint[]>('/poi/', { params }),
      '/poi/'
    );

    return response.data;
  }

  /**
   * Get a single charging point by ID
   * 
   * @param chargePointId - The ID of the charging point
   * @returns Promise resolving to the charging point data
   */
  async getChargingPoint(chargePointId: number): Promise<ChargingPoint | null> {
    const params = {
      chargepointid: chargePointId,
      output: 'json',
      key: this.apiKey,
    };

    try {
      const response = await this._requestWithRetry<ChargingPoint[]>(
        () => this.axiosInstance.get<ChargingPoint[]>('/poi/', { params }),
        `/poi/?chargepointid=${chargePointId}`
      );

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get reference data (connection types, operators, etc.)
   * 
   * @param referenceType - Type of reference data (e.g., 'connectiontype', 'operator', 'statustype')
   * @returns Promise resolving to reference data array
   */
  async getReferenceData(referenceType: string): Promise<any[]> {
    const params = {
      output: 'json',
      key: this.apiKey,
    };

    const response = await this._requestWithRetry<any[]>(
      () => this.axiosInstance.get<any[]>(`/referencedata/${referenceType}`, { params }),
      `/referencedata/${referenceType}`
    );

    return response.data;
  }

  /**
   * Internal method to execute request with retry logic
   * 
   * Implements retry logic for rate limit errors (429) and server errors (5xx)
   * 
   * @param requestFn - Function that returns the axios request promise
   * @param endpoint - Endpoint path for logging
   * @returns Promise resolving to the API response
   */
  private async _requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    endpoint: string
  ): Promise<OcmApiResponse<T>> {
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

        // Retry on rate limit (429) or server errors (5xx)
        if (this._isRetryableError(error) && attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          
          console.warn(`[OcmAdapter] Retryable error, retrying in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries + 1})`, {
            endpoint,
            status: error.response?.status,
          });

          await this._sleep(delay);
          continue;
        }

        // If not retryable, or max retries reached, throw
        throw this._formatError(error, endpoint);
      }
    }

    // Should never reach here, but TypeScript requires it
    throw this._formatError(lastError || new Error('Unknown error'), endpoint);
  }

  /**
   * Check if error is retryable (429 or 5xx)
   * 
   * @param error - The error object
   * @returns true if the error is retryable
   */
  private _isRetryableError(error: any): boolean {
    if (error.response) {
      const status = error.response.status;
      // Retry on rate limit (429) or server errors (5xx)
      return status === 429 || (status >= 500 && status < 600);
    }

    // Check error message for retryable indicators
    const message = error.message?.toLowerCase() || '';
    return message.includes('rate limit') || 
           message.includes('429') ||
           message.includes('timeout') ||
           message.includes('network');
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
      `OcmAdapter request failed: ${message}${status ? ` (${status} ${statusText})` : ''} - ${endpoint}`
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
   * Get the configured API key status (without exposing it)
   * 
   * @returns Whether API key is configured (true/false)
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

/**
 * Create an OcmAdapter instance from environment variables
 * 
 * Uses OPEN_CHARGE_MAP_API_KEY from environment.
 * 
 * @param overrides - Optional configuration overrides
 * @returns OcmAdapter instance
 */
export function createOcmAdapter(overrides?: Partial<OcmAdapterConfig>): OcmAdapter {
  const apiKey = process.env.OPEN_CHARGE_MAP_API_KEY || overrides?.apiKey;
  
  if (!apiKey) {
    throw new Error(
      'OcmAdapter: OPEN_CHARGE_MAP_API_KEY environment variable is required'
    );
  }

  return new OcmAdapter({
    apiKey,
    baseURL: overrides?.baseURL ?? 'https://api.openchargemap.io/v3',
    maxRetries: overrides?.maxRetries ?? 3,
    retryDelay: overrides?.retryDelay ?? 1000,
  });
}
