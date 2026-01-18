/**
 * Unit Tests for OCM (Open Charge Map) Adapter
 * 
 * Tests Open Charge Map API integration for EV charging station queries.
 * 
 * Per TRD-122: Open Charge Map provides EV station data
 * Per PRDRDOGG-97: Filtering for EV charging stations by connector type
 * 
 * @module apps/functions/src/adapters/ocm/OcmAdapter.test
 */

import { OcmAdapter, createOcmAdapter, ChargingPoint } from './OcmAdapter';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('OcmAdapter', () => {
  let adapter: OcmAdapter;
  const testApiKey = 'test-api-key-12345';
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  beforeEach(() => {
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    adapter = new OcmAdapter({ apiKey: testApiKey });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const adapter = new OcmAdapter({ apiKey: testApiKey });
      expect(adapter.hasApiKey()).toBe(true);
    });

    it('should throw error if API key is not provided', () => {
      expect(() => {
        new OcmAdapter({ apiKey: '' });
      }).toThrow('OcmAdapter: apiKey is required');
    });

    it('should use default base URL', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.openchargemap.io/v3',
        })
      );
    });

    it('should set API key in headers', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': testApiKey,
          }),
        })
      );
    });
  });

  describe('searchChargingPoints', () => {
    const mockChargingPoints: ChargingPoint[] = [
      {
        ID: 1,
        UUID: 'uuid-1',
        AddressInfo: {
          ID: 1,
          Title: 'Test Station 1',
          Latitude: 37.7749,
          Longitude: -122.4194,
          CountryID: 1,
          Country: {
            ISOCode: 'US',
            Title: 'United States',
          },
        },
        Connections: [
          {
            ID: 1,
            ConnectionTypeID: 2,
            ConnectionType: {
              ID: 2,
              Title: 'Type 2',
            },
            StatusTypeID: 50,
            StatusType: {
              ID: 50,
              Title: 'Available',
              IsOperational: true,
            },
          },
        ],
      },
    ];

    it('should search charging points with location', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockChargingPoints,
        status: 200,
        statusText: 'OK',
      });

      const results = await adapter.searchChargingPoints({
        latitude: 37.7749,
        longitude: -122.4194,
      });

      expect(results).toEqual(mockChargingPoints);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/poi/',
        expect.objectContaining({
          params: expect.objectContaining({
            latitude: 37.7749,
            longitude: -122.4194,
            distance: 10,
            maxresults: 50,
            output: 'json',
            key: testApiKey,
          }),
        })
      );
    });

    it('should filter by connection type (Per PRDRDOGG-97)', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockChargingPoints,
        status: 200,
        statusText: 'OK',
      });

      await adapter.searchChargingPoints({
        latitude: 37.7749,
        longitude: -122.4194,
        connectionTypeId: 2,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/poi/',
        expect.objectContaining({
          params: expect.objectContaining({
            connectiontypeid: 2,
          }),
        })
      );
    });

    it('should use custom distance and maxResults', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockChargingPoints,
        status: 200,
        statusText: 'OK',
      });

      await adapter.searchChargingPoints({
        latitude: 37.7749,
        longitude: -122.4194,
        distance: 25,
        maxResults: 100,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/poi/',
        expect.objectContaining({
          params: expect.objectContaining({
            distance: 25,
            maxresults: 100,
          }),
        })
      );
    });

    it('should include optional filters', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockChargingPoints,
        status: 200,
        statusText: 'OK',
      });

      await adapter.searchChargingPoints({
        latitude: 37.7749,
        longitude: -122.4194,
        operatorId: 1,
        statusId: 50,
        countryCode: 'US',
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/poi/',
        expect.objectContaining({
          params: expect.objectContaining({
            operatorid: 1,
            statusid: 50,
            countrycode: 'US',
          }),
        })
      );
    });

    it('should retry on rate limit errors', async () => {
      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: { status: 429, statusText: 'Too Many Requests' },
          message: 'Rate limit exceeded',
        })
        .mockResolvedValueOnce({
          data: mockChargingPoints,
          status: 200,
          statusText: 'OK',
        });

      const results = await adapter.searchChargingPoints({
        latitude: 37.7749,
        longitude: -122.4194,
      });

      expect(results).toEqual(mockChargingPoints);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should retry on server errors (5xx)', async () => {
      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: { status: 500, statusText: 'Internal Server Error' },
          message: 'Server error',
        })
        .mockResolvedValueOnce({
          data: mockChargingPoints,
          status: 200,
          statusText: 'OK',
        });

      const results = await adapter.searchChargingPoints({
        latitude: 37.7749,
        longitude: -122.4194,
      });

      expect(results).toEqual(mockChargingPoints);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 429, statusText: 'Too Many Requests' },
        message: 'Rate limit exceeded',
      });

      await expect(
        adapter.searchChargingPoints({
          latitude: 37.7749,
          longitude: -122.4194,
        })
      ).rejects.toThrow('OcmAdapter request failed');
    });
  });

  describe('getChargingPoint', () => {
    const mockChargingPoint: ChargingPoint = {
      ID: 1,
      UUID: 'uuid-1',
      AddressInfo: {
        ID: 1,
        Title: 'Test Station',
        Latitude: 37.7749,
        Longitude: -122.4194,
        CountryID: 1,
        Country: {
          ISOCode: 'US',
          Title: 'United States',
        },
      },
    };

    it('should get a single charging point by ID', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [mockChargingPoint],
        status: 200,
        statusText: 'OK',
      });

      const result = await adapter.getChargingPoint(1);

      expect(result).toEqual(mockChargingPoint);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/poi/',
        expect.objectContaining({
          params: expect.objectContaining({
            chargepointid: 1,
            key: testApiKey,
          }),
        })
      );
    });

    it('should return null if charging point not found', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [],
        status: 200,
        statusText: 'OK',
      });

      const result = await adapter.getChargingPoint(999);

      expect(result).toBeNull();
    });

    it('should return null on 404 error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: { status: 404, statusText: 'Not Found' },
        message: 'Not found',
      });

      const result = await adapter.getChargingPoint(999);

      expect(result).toBeNull();
    });
  });

  describe('getReferenceData', () => {
    const mockReferenceData = [
      { ID: 1, Title: 'Type 1' },
      { ID: 2, Title: 'Type 2' },
    ];

    it('should get reference data for connection types', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockReferenceData,
        status: 200,
        statusText: 'OK',
      });

      const results = await adapter.getReferenceData('connectiontype');

      expect(results).toEqual(mockReferenceData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/referencedata/connectiontype',
        expect.objectContaining({
          params: expect.objectContaining({
            output: 'json',
            key: testApiKey,
          }),
        })
      );
    });

    it('should get reference data for operators', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockReferenceData,
        status: 200,
        statusText: 'OK',
      });

      await adapter.getReferenceData('operator');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/referencedata/operator',
        expect.any(Object)
      );
    });
  });

  describe('createOcmAdapter', () => {
    it('should create adapter from environment variable', () => {
      const originalEnv = process.env.OPEN_CHARGE_MAP_API_KEY;
      process.env.OPEN_CHARGE_MAP_API_KEY = 'env-api-key';

      const adapter = createOcmAdapter();

      expect(adapter).toBeInstanceOf(OcmAdapter);
      expect(adapter.hasApiKey()).toBe(true);

      process.env.OPEN_CHARGE_MAP_API_KEY = originalEnv;
    });

    it('should throw error if API key not in environment', () => {
      const originalEnv = process.env.OPEN_CHARGE_MAP_API_KEY;
      delete process.env.OPEN_CHARGE_MAP_API_KEY;

      expect(() => {
        createOcmAdapter();
      }).toThrow('OPEN_CHARGE_MAP_API_KEY environment variable is required');

      process.env.OPEN_CHARGE_MAP_API_KEY = originalEnv;
    });

    it('should allow configuration overrides', () => {
      const adapter = createOcmAdapter({
        apiKey: 'override-key',
        baseURL: 'https://custom-api.example.com',
        maxRetries: 5,
      });

      expect(adapter.hasApiKey()).toBe(true);
    });
  });
});
