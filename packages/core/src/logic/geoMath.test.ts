/**
 * Unit Tests for GeoMath Algorithms
 * 
 * Tests Haversine distance calculation and bounding box determination.
 * Validates correct distances for known coordinate pairs per TRD-332.
 * 
 * @module @roaddoggs/core/logic/geoMath.test
 */

import { describe, it, expect } from 'vitest';
import { haversineDistance, calculateBoundingBox } from './geoMath';
import type { GeoJSONPoint, GeoTuple, Waypoint } from '../models/trip';
import { WaypointType } from '../models/trip';

/**
 * Helper: Create a GeoJSONPoint from latitude and longitude
 */
function createGeoJSONPoint(latitude: number, longitude: number): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
  };
}

/**
 * Helper: Create a GeoTuple from latitude and longitude
 */
function createGeoTuple(latitude: number, longitude: number): GeoTuple {
  return [latitude, longitude]; // GeoTuple format: [lat, lng]
}

/**
 * Helper: Create a mock Waypoint with GeoJSONPoint location
 */
function createMockWaypoint(id: string, latitude: number, longitude: number): Waypoint {
  return {
    id,
    tripId: 'trip-123',
    location: createGeoJSONPoint(latitude, longitude),
    placeId: `place-${id}`,
    type: WaypointType.STOP,
    orderIndex: 0,
    locked: false,
    notes: '',
  };
}

describe('GeoMath Algorithms', () => {
  describe('haversineDistance(point1, point2)', () => {
    describe('Known Coordinate Pairs (TRD-332)', () => {
      it('should calculate correct distance from New York to London (~5,585 km)', () => {
        // New York: 40.7127281° N, 74.0060152° W
        // London: 51.508530° N, 0.125740° W
        const nyGeoJSON = createGeoJSONPoint(40.7127281, -74.0060152);
        const londonGeoJSON = createGeoJSONPoint(51.508530, -0.125740);

        const distance = haversineDistance(nyGeoJSON, londonGeoJSON);

        // Allow ±10 km tolerance for long distances (actual ~5,570 km)
        expect(distance).toBeGreaterThanOrEqual(5560);
        expect(distance).toBeLessThanOrEqual(5580);
      });

      it('should calculate correct distance from San Francisco to Los Angeles (~559 km)', () => {
        // San Francisco: 37.7749° N, 122.4194° W
        // Los Angeles: 34.0522° N, 118.2437° W
        const sfGeoJSON = createGeoJSONPoint(37.7749, -122.4194);
        const laGeoJSON = createGeoJSONPoint(34.0522, -118.2437);

        const distance = haversineDistance(sfGeoJSON, laGeoJSON);

        // Allow ±5 km tolerance for medium distances
        expect(distance).toBeGreaterThanOrEqual(554);
        expect(distance).toBeLessThanOrEqual(564);
      });

      it('should calculate correct distance from Paris to Tokyo (~9,710 km)', () => {
        // Paris: 48.8566° N, 2.3522° E
        // Tokyo: 35.6762° N, 139.6503° E
        const parisGeoJSON = createGeoJSONPoint(48.8566, 2.3522);
        const tokyoGeoJSON = createGeoJSONPoint(35.6762, 139.6503);

        const distance = haversineDistance(parisGeoJSON, tokyoGeoJSON);

        // Allow ±20 km tolerance for very long distances
        expect(distance).toBeGreaterThanOrEqual(9690);
        expect(distance).toBeLessThanOrEqual(9730);
      });

      it('should calculate correct distance using GeoTuple format', () => {
        // New York to London using GeoTuple format
        const nyTuple: GeoTuple = [40.7127281, -74.0060152];
        const londonTuple: GeoTuple = [51.508530, -0.125740];

        const distance = haversineDistance(nyTuple, londonTuple);

        // Allow ±10 km tolerance (actual ~5,570 km)
        expect(distance).toBeGreaterThanOrEqual(5560);
        expect(distance).toBeLessThanOrEqual(5580);
      });
    });

    describe('Input Format Compatibility', () => {
      it('should handle both GeoJSONPoint inputs', () => {
        const point1 = createGeoJSONPoint(37.7749, -122.4194);
        const point2 = createGeoJSONPoint(34.0522, -118.2437);

        const distance = haversineDistance(point1, point2);

        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
      });

      it('should handle both GeoTuple inputs', () => {
        const point1: GeoTuple = [37.7749, -122.4194];
        const point2: GeoTuple = [34.0522, -118.2437];

        const distance = haversineDistance(point1, point2);

        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
      });

      it('should handle mixed input formats (GeoJSONPoint + GeoTuple)', () => {
        const point1 = createGeoJSONPoint(37.7749, -122.4194);
        const point2: GeoTuple = [34.0522, -118.2437];

        const distance = haversineDistance(point1, point2);

        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
      });

      it('should handle mixed input formats (GeoTuple + GeoJSONPoint)', () => {
        const point1: GeoTuple = [37.7749, -122.4194];
        const point2 = createGeoJSONPoint(34.0522, -118.2437);

        const distance = haversineDistance(point1, point2);

        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
      });

      it('should return same distance regardless of input format', () => {
        const sfGeoJSON = createGeoJSONPoint(37.7749, -122.4194);
        const laGeoJSON = createGeoJSONPoint(34.0522, -118.2437);
        const sfTuple: GeoTuple = [37.7749, -122.4194];
        const laTuple: GeoTuple = [34.0522, -118.2437];

        const distance1 = haversineDistance(sfGeoJSON, laGeoJSON);
        const distance2 = haversineDistance(sfTuple, laTuple);
        const distance3 = haversineDistance(sfGeoJSON, laTuple);
        const distance4 = haversineDistance(sfTuple, laGeoJSON);

        expect(distance1).toBe(distance2);
        expect(distance1).toBe(distance3);
        expect(distance1).toBe(distance4);
      });
    });

    describe('Edge Cases', () => {
      it('should return 0 for identical coordinates', () => {
        const point = createGeoJSONPoint(40.7127281, -74.0060152);

        const distance = haversineDistance(point, point);

        expect(distance).toBe(0);
      });

      it('should return 0 for identical coordinates (GeoTuple)', () => {
        const point: GeoTuple = [40.7127281, -74.0060152];

        const distance = haversineDistance(point, point);

        expect(distance).toBe(0);
      });

      it('should return small distance for very close points', () => {
        // Two points within same city (NYC Central Park to Times Square)
        const point1 = createGeoJSONPoint(40.7829, -73.9654);
        const point2 = createGeoJSONPoint(40.7589, -73.9851);

        const distance = haversineDistance(point1, point2);

        // Should be about 3-4 km
        expect(distance).toBeGreaterThan(2);
        expect(distance).toBeLessThan(5);
      });

      it('should return positive distance for any two different points', () => {
        const point1 = createGeoJSONPoint(0, 0);
        const point2 = createGeoJSONPoint(1, 1);

        const distance = haversineDistance(point1, point2);

        expect(distance).toBeGreaterThan(0);
      });

      it('should handle equator crossing', () => {
        // Point north of equator to point south of equator
        const point1 = createGeoJSONPoint(10, 0);
        const point2 = createGeoJSONPoint(-10, 0);

        const distance = haversineDistance(point1, point2);

        // Should be about 2,220 km (10° + 10° = 20° latitude)
        expect(distance).toBeGreaterThan(2200);
        expect(distance).toBeLessThan(2240);
      });

      it('should handle points on same meridian', () => {
        // Two points on same longitude (meridian)
        const point1 = createGeoJSONPoint(40, 0);
        const point2 = createGeoJSONPoint(50, 0);

        const distance = haversineDistance(point1, point2);

        // Should be about 1,111 km (10° latitude)
        expect(distance).toBeGreaterThan(1100);
        expect(distance).toBeLessThan(1120);
      });

      it('should handle points on same parallel', () => {
        // Two points on same latitude (parallel)
        const point1 = createGeoJSONPoint(40, -10);
        const point2 = createGeoJSONPoint(40, 10);

        const distance = haversineDistance(point1, point2);

        // At 40° latitude, 20° longitude difference is ~1,700 km
        expect(distance).toBeGreaterThan(1680);
        expect(distance).toBeLessThan(1720);
      });

      it('should return distance in kilometers', () => {
        // Verify unit is kilometers (NY to London should be ~5,585 km, not miles)
        const ny = createGeoJSONPoint(40.7127281, -74.0060152);
        const london = createGeoJSONPoint(51.508530, -0.125740);

        const distance = haversineDistance(ny, london);

        // If in miles, would be ~3,470; if in km, ~5,585
        expect(distance).toBeGreaterThan(5000);
        expect(distance).toBeLessThan(6000);
      });
    });

    describe('Precision and Validation', () => {
      it('should return a number', () => {
        const point1 = createGeoJSONPoint(40, -74);
        const point2 = createGeoJSONPoint(50, 0);

        const distance = haversineDistance(point1, point2);

        expect(typeof distance).toBe('number');
        expect(isNaN(distance)).toBe(false);
        expect(isFinite(distance)).toBe(true);
      });

      it('should have reasonable precision (at least 2 decimal places)', () => {
        const point1 = createGeoJSONPoint(37.7749, -122.4194);
        const point2 = createGeoJSONPoint(34.0522, -118.2437);

        const distance = haversineDistance(point1, point2);

        // Should have decimal precision
        expect(distance).not.toBe(Math.floor(distance));
        expect(distance.toString().split('.')[1]?.length || 0).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('calculateBoundingBox(waypoints)', () => {
    describe('Multiple Waypoints', () => {
      it('should calculate bounding box for two waypoints', () => {
        const waypoint1 = createMockWaypoint('wp1', 40.7128, -74.0060); // New York
        const waypoint2 = createMockWaypoint('wp2', 34.0522, -118.2437); // Los Angeles

        const bounds = calculateBoundingBox([waypoint1, waypoint2]);

        expect(bounds).toHaveLength(2);
        expect(bounds[0][0]).toBeLessThanOrEqual(bounds[1][0]); // minLat <= maxLat
        expect(bounds[0][1]).toBeLessThanOrEqual(bounds[1][1]); // minLng <= maxLng
        expect(bounds[0][0]).toBeCloseTo(34.0522, 3); // South (min lat)
        expect(bounds[1][0]).toBeCloseTo(40.7128, 3); // North (max lat)
      });

      it('should calculate bounding box for three waypoints', () => {
        const waypoint1 = createMockWaypoint('wp1', 37.7749, -122.4194); // San Francisco
        const waypoint2 = createMockWaypoint('wp2', 34.0522, -118.2437); // Los Angeles
        const waypoint3 = createMockWaypoint('wp3', 40.7128, -74.0060); // New York

        const bounds = calculateBoundingBox([waypoint1, waypoint2, waypoint3]);

        expect(bounds).toHaveLength(2);
        expect(bounds[0][0]).toBeCloseTo(34.0522, 3); // South (min lat = LA)
        expect(bounds[1][0]).toBeCloseTo(40.7128, 3); // North (max lat = NY)
        expect(bounds[0][1]).toBeCloseTo(-122.4194, 3); // West (min lng = SF)
        expect(bounds[1][1]).toBeCloseTo(-74.0060, 3); // East (max lng = NY)
      });

      it('should calculate bounding box for multiple waypoints in different quadrants', () => {
        const waypoint1 = createMockWaypoint('wp1', 51.5085, -0.1257); // London (NE)
        const waypoint2 = createMockWaypoint('wp2', -33.8688, 151.2093); // Sydney (SE)
        const waypoint3 = createMockWaypoint('wp3', 40.7128, -74.0060); // New York (NW)
        const waypoint4 = createMockWaypoint('wp4', -34.6037, -58.3816); // Buenos Aires (SW)

        const bounds = calculateBoundingBox([waypoint1, waypoint2, waypoint3, waypoint4]);

        expect(bounds).toHaveLength(2);
        expect(bounds[0][0]).toBeCloseTo(-34.6037, 3); // South (min lat = Buenos Aires)
        expect(bounds[1][0]).toBeCloseTo(51.5085, 3); // North (max lat = London)
        expect(bounds[0][1]).toBeCloseTo(-74.0060, 3); // West (min lng = New York)
        expect(bounds[1][1]).toBeCloseTo(151.2093, 3); // East (max lng = Sydney)
      });

      it('should return SouthWest as first element and NorthEast as second', () => {
        const waypoint1 = createMockWaypoint('wp1', 40.7128, -74.0060); // NY
        const waypoint2 = createMockWaypoint('wp2', 34.0522, -118.2437); // LA

        const bounds = calculateBoundingBox([waypoint1, waypoint2]);

        const [southWest, northEast] = bounds;
        
        // SouthWest should have minimum latitude and minimum longitude
        expect(southWest[0]).toBeLessThanOrEqual(northEast[0]); // minLat <= maxLat
        expect(southWest[1]).toBeLessThanOrEqual(northEast[1]); // minLng <= maxLng
        
        // Format should be [latitude, longitude]
        expect(southWest).toHaveLength(2);
        expect(northEast).toHaveLength(2);
      });
    });

    describe('Single Waypoint', () => {
      it('should return same point for SW and NE when only one waypoint', () => {
        const waypoint = createMockWaypoint('wp1', 40.7128, -74.0060);

        const bounds = calculateBoundingBox([waypoint]);

        expect(bounds).toHaveLength(2);
        expect(bounds[0][0]).toBe(bounds[1][0]); // SW lat = NE lat
        expect(bounds[0][1]).toBe(bounds[1][1]); // SW lng = NE lng
        expect(bounds[0][0]).toBeCloseTo(40.7128, 4);
        expect(bounds[0][1]).toBeCloseTo(-74.0060, 4);
      });

      it('should return correct format for single waypoint', () => {
        const waypoint = createMockWaypoint('wp1', 37.7749, -122.4194);

        const bounds = calculateBoundingBox([waypoint]);

        // Should return GeoTuple[] format: [[lat, lng], [lat, lng]]
        expect(bounds[0]).toEqual([37.7749, -122.4194]);
        expect(bounds[1]).toEqual([37.7749, -122.4194]);
      });
    });

    describe('Edge Cases', () => {
      it('should throw error for empty waypoints array', () => {
        expect(() => {
          calculateBoundingBox([]);
        }).toThrow('Cannot calculate bounding box for empty waypoints array');
      });

      it('should handle waypoints with same location', () => {
        const waypoint1 = createMockWaypoint('wp1', 40.7128, -74.0060);
        const waypoint2 = createMockWaypoint('wp2', 40.7128, -74.0060);

        const bounds = calculateBoundingBox([waypoint1, waypoint2]);

        expect(bounds[0][0]).toBe(bounds[1][0]); // SW = NE
        expect(bounds[0][1]).toBe(bounds[1][1]);
      });

      it('should handle waypoints forming a perfect rectangle', () => {
        // Four waypoints forming a rectangle
        const waypoint1 = createMockWaypoint('wp1', 40, -74); // NW corner
        const waypoint2 = createMockWaypoint('wp2', 40, -70); // NE corner
        const waypoint3 = createMockWaypoint('wp3', 35, -74); // SW corner
        const waypoint4 = createMockWaypoint('wp4', 35, -70); // SE corner

        const bounds = calculateBoundingBox([waypoint1, waypoint2, waypoint3, waypoint4]);

        expect(bounds[0][0]).toBeCloseTo(35, 0); // South (min lat)
        expect(bounds[1][0]).toBeCloseTo(40, 0); // North (max lat)
        expect(bounds[0][1]).toBeCloseTo(-74, 0); // West (min lng)
        expect(bounds[1][1]).toBeCloseTo(-70, 0); // East (max lng)
      });

      it('should handle waypoints with negative coordinates', () => {
        const waypoint1 = createMockWaypoint('wp1', -33.8688, 151.2093); // Sydney
        const waypoint2 = createMockWaypoint('wp2', -34.6037, -58.3816); // Buenos Aires

        const bounds = calculateBoundingBox([waypoint1, waypoint2]);

        expect(bounds[0][0]).toBeLessThan(0); // South (negative latitude)
        expect(bounds[0][1]).toBeLessThan(0); // West (negative longitude for Buenos Aires)
        expect(bounds[1][0]).toBeLessThan(0); // North (still negative, closer to 0)
        expect(bounds[1][1]).toBeGreaterThan(0); // East (positive longitude for Sydney)
      });
    });

    describe('Output Format Validation', () => {
      it('should return GeoTuple[] format with 2 elements', () => {
        const waypoint = createMockWaypoint('wp1', 40.7128, -74.0060);

        const bounds = calculateBoundingBox([waypoint]);

        expect(Array.isArray(bounds)).toBe(true);
        expect(bounds).toHaveLength(2);
        expect(Array.isArray(bounds[0])).toBe(true);
        expect(Array.isArray(bounds[1])).toBe(true);
        expect(bounds[0]).toHaveLength(2);
        expect(bounds[1]).toHaveLength(2);
      });

      it('should return [latitude, longitude] format (not [lng, lat])', () => {
        const waypoint1 = createMockWaypoint('wp1', 40.7128, -74.0060); // NY: 40.7128° N, 74.0060° W
        const waypoint2 = createMockWaypoint('wp2', 34.0522, -118.2437); // LA: 34.0522° N, 118.2437° W

        const bounds = calculateBoundingBox([waypoint1, waypoint2]);

        // First element is [minLat, minLng] = [34.0522, -118.2437]
        expect(bounds[0][0]).toBeCloseTo(34.0522, 3); // latitude (should be smaller)
        expect(bounds[0][1]).toBeCloseTo(-118.2437, 3); // longitude (should be more negative)

        // Second element is [maxLat, maxLng] = [40.7128, -74.0060]
        expect(bounds[1][0]).toBeCloseTo(40.7128, 3); // latitude (should be larger)
        expect(bounds[1][1]).toBeCloseTo(-74.0060, 3); // longitude (should be less negative)
      });

      it('should return SouthWest with minimum values and NorthEast with maximum values', () => {
        const waypoint1 = createMockWaypoint('wp1', 50, 10); // NE
        const waypoint2 = createMockWaypoint('wp2', 30, -10); // SW
        const waypoint3 = createMockWaypoint('wp3', 40, 0); // Center

        const bounds = calculateBoundingBox([waypoint1, waypoint2, waypoint3]);

        const [southWest, northEast] = bounds;

        // SouthWest should have minimum latitude and minimum longitude
        expect(southWest[0]).toBe(30); // min lat
        expect(southWest[1]).toBe(-10); // min lng

        // NorthEast should have maximum latitude and maximum longitude
        expect(northEast[0]).toBe(50); // max lat
        expect(northEast[1]).toBe(10); // max lng
      });
    });
  });
});
