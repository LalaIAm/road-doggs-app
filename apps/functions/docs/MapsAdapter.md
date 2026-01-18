# MapsAdapter Documentation

The MapsAdapter provides a secure, rate-limited wrapper around the Google Maps Platform APIs using Axios.

## Overview

The MapsAdapter encapsulates all Google Maps API calls, automatically injecting API keys and handling rate limiting errors with automatic retries.

## Installation

The MapsAdapter is part of the `@roaddoggs/functions` package and is automatically available when using Firebase Functions.

## Configuration

### Environment Variables

Set the following environment variable:

```bash
GOOGLE_MAPS_SERVER_KEY=your-google-maps-server-api-key
```

### Creating an Instance

```typescript
import { createMapsAdapter } from './adapters/maps/MapsAdapter';

// Create with default configuration (uses GOOGLE_MAPS_SERVER_KEY from env)
const mapsAdapter = createMapsAdapter();

// Or with custom configuration
const mapsAdapter = createMapsAdapter({
  apiKey: 'custom-key',
  baseURL: 'https://maps.googleapis.com',
  maxRetries: 5,
  retryDelay: 2000, // 2 seconds
});
```

### Manual Instantiation

```typescript
import { MapsAdapter } from './adapters/maps/MapsAdapter';

const adapter = new MapsAdapter({
  apiKey: process.env.GOOGLE_MAPS_SERVER_KEY!,
  baseURL: 'https://maps.googleapis.com',
  maxRetries: 3,
  retryDelay: 1000,
});
```

## API Reference

### Methods

#### `get<T>(endpoint, params?, config?)`

Make a GET request to the Google Maps API.

**Parameters:**
- `endpoint` (string): API endpoint path (e.g., `/maps/api/geocode/json`)
- `params` (Record<string, any>, optional): Query parameters (API key is automatically added)
- `config` (AxiosRequestConfig, optional): Additional Axios configuration

**Returns:** `Promise<MapsApiResponse<T>>`

**Example:**
```typescript
const response = await mapsAdapter.get('/maps/api/geocode/json', {
  address: '1600 Amphitheatre Parkway, Mountain View, CA'
});

console.log(response.data); // Geocoding results
```

#### `post<T>(endpoint, data?, params?, config?)`

Make a POST request to the Google Maps API.

**Parameters:**
- `endpoint` (string): API endpoint path
- `data` (any, optional): Request body data
- `params` (Record<string, any>, optional): Query parameters
- `config` (AxiosRequestConfig, optional): Additional Axios configuration

**Returns:** `Promise<MapsApiResponse<T>>`

**Example:**
```typescript
const response = await mapsAdapter.post('/maps/api/directions/json', {
  origin: 'New York, NY',
  destination: 'Los Angeles, CA',
  waypoints: ['Chicago, IL']
});
```

#### `hasApiKey()`

Check if an API key is configured.

**Returns:** `boolean`

**Example:**
```typescript
if (mapsAdapter.hasApiKey()) {
  // Safe to make requests
}
```

## Response Format

All methods return a `MapsApiResponse<T>` object:

```typescript
interface MapsApiResponse<T> {
  data: T;           // Response data
  status: number;   // HTTP status code
  statusText: string; // HTTP status text
}
```

## Rate Limiting & Retry Logic

The MapsAdapter automatically handles rate limiting:

- **Automatic Retry**: On 429 (Rate Limit) errors, the adapter retries with exponential backoff
- **Max Retries**: Default is 3 attempts (configurable)
- **Retry Delay**: Starts at 1 second, doubles with each retry (configurable)

**Example retry sequence:**
1. Initial request → 429 error
2. Wait 1 second → Retry → 429 error
3. Wait 2 seconds → Retry → 429 error
4. Wait 4 seconds → Retry → Success or throw error

## Error Handling

The MapsAdapter provides consistent error formatting:

```typescript
try {
  const response = await mapsAdapter.get('/maps/api/geocode/json', {
    address: 'Invalid address'
  });
} catch (error) {
  // Error is formatted as: "MapsAdapter request failed: <message> (<status> <statusText>) - <endpoint>"
  console.error(error.message);
  
  // Access original response data if available
  if (error.responseData) {
    console.error('API Error Details:', error.responseData);
  }
}
```

## Usage Examples

### Geocoding

```typescript
const geocodeResponse = await mapsAdapter.get('/maps/api/geocode/json', {
  address: '1600 Amphitheatre Parkway, Mountain View, CA'
});

const location = geocodeResponse.data.results[0].geometry.location;
console.log(`Lat: ${location.lat}, Lng: ${location.lng}`);
```

### Reverse Geocoding

```typescript
const reverseGeocodeResponse = await mapsAdapter.get('/maps/api/geocode/json', {
  latlng: '37.4219983,-122.084'
});

const address = reverseGeocodeResponse.data.results[0].formatted_address;
console.log(`Address: ${address}`);
```

### Places API

```typescript
const placesResponse = await mapsAdapter.get('/maps/api/place/nearbysearch/json', {
  location: '37.4219983,-122.084',
  radius: 1000,
  type: 'restaurant'
});

const restaurants = placesResponse.data.results;
```

### Directions API

```typescript
const directionsResponse = await mapsAdapter.get('/maps/api/directions/json', {
  origin: 'New York, NY',
  destination: 'Los Angeles, CA',
  waypoints: 'Chicago, IL|Denver, CO',
  optimize: true
});

const route = directionsResponse.data.routes[0];
console.log(`Distance: ${route.legs[0].distance.text}`);
console.log(`Duration: ${route.legs[0].duration.text}`);
```

## Best Practices

1. **Reuse Instances**: Create one MapsAdapter instance and reuse it across requests
2. **Handle Errors**: Always wrap API calls in try-catch blocks
3. **Check API Key**: Use `hasApiKey()` before making requests in production
4. **Monitor Rate Limits**: Log retry attempts to monitor API usage
5. **Cache Responses**: Cache frequently requested data to reduce API calls

## Configuration Options

```typescript
interface MapsAdapterConfig {
  apiKey: string;           // Required: Google Maps API key
  baseURL?: string;         // Default: 'https://maps.googleapis.com'
  maxRetries?: number;       // Default: 3
  retryDelay?: number;       // Default: 1000ms
}
```

## Implementation Details

- **Base URL**: `https://maps.googleapis.com`
- **Timeout**: 30 seconds per request
- **Content-Type**: `application/json`
- **API Key Injection**: Automatically added as `key` query parameter
- **Retry Strategy**: Exponential backoff for 429 errors only

## Related Documentation

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Maps API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Rate Limiting Best Practices](https://developers.google.com/maps/api-security-best-practices)
