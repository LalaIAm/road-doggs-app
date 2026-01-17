/**
 * GeoMath Algorithms
 * 
 * Geographic mathematics utilities for distance calculation and bounding box determination.
 * Implements Haversine formula for great-circle distance and bounding box calculation.
 * 
 * @module @roaddoggs/core/logic/geoMath
 */

import type { GeoJSONPoint, GeoTuple, Waypoint } from '../models/trip';

/**
 * Earth's radius in kilometers
 * Used for Haversine distance calculations
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract latitude and longitude from a point
 * Handles both GeoJSONPoint (coordinates: [lng, lat]) and GeoTuple ([lat, lng]) formats
 * 
 * @param {GeoJSONPoint | GeoTuple} point - Geographic point
 * @returns {{ latitude: number; longitude: number }} Latitude and longitude values
 */
function extractLatLng(point: GeoJSONPoint | GeoTuple): { latitude: number; longitude: number } {
  // Check if it's a GeoJSONPoint (has type and coordinates properties)
  if ('type' in point && 'coordinates' in point && point.type === 'Point') {
    // GeoJSONPoint: coordinates are [longitude, latitude]
    const [longitude, latitude] = point.coordinates;
    return { latitude, longitude };
  }
  
  // Otherwise, it's a GeoTuple: [latitude, longitude]
  const [latitude, longitude] = point as GeoTuple;
  return { latitude, longitude };
}

/**
 * Calculate great-circle distance between two geographic points using Haversine formula
 * 
 * Formula steps (per TRD-136-138):
 * 1. a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
 * 2. c = 2 · atan2(√a, √(1-a))
 * 3. d = R · c where R = 6371 km (TRD-139)
 * 
 * @param {GeoJSONPoint | GeoTuple} point1 - First geographic point
 * @param {GeoJSONPoint | GeoTuple} point2 - Second geographic point
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(
  point1: GeoJSONPoint | GeoTuple,
  point2: GeoJSONPoint | GeoTuple
): number {
  const { latitude: lat1, longitude: lng1 } = extractLatLng(point1);
  const { latitude: lat2, longitude: lng2 } = extractLatLng(point2);
  
  // Convert degrees to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lng2 - lng1);
  
  // Haversine formula (TRD-136)
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  
  // Calculate central angle (TRD-137)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Calculate distance (TRD-138-139)
  const distance = EARTH_RADIUS_KM * c;
  
  return distance;
}

/**
 * Calculate bounding box from an array of waypoints
 * 
 * Algorithm (per TRD-141-142):
 * - SouthWest = (min(lat), min(lng)) for all waypoints
 * - NorthEast = (max(lat), max(lng)) for all waypoints
 * 
 * @param {Waypoint[]} waypoints - Array of waypoints with GeoJSONPoint locations
 * @returns {GeoTuple[]} Array of two GeoTuples [SouthWest, NorthEast] where each is [latitude, longitude]
 * @throws {Error} If waypoints array is empty
 */
export function calculateBoundingBox(waypoints: Waypoint[]): GeoTuple[] {
  if (waypoints.length === 0) {
    throw new Error('Cannot calculate bounding box for empty waypoints array');
  }
  
  // Handle single waypoint (SW = NE)
  if (waypoints.length === 1) {
    const { location } = waypoints[0];
    // GeoJSONPoint coordinates are [longitude, latitude], but GeoTuple is [latitude, longitude]
    const [longitude, latitude] = location.coordinates;
    return [[latitude, longitude], [latitude, longitude]];
  }
  
  // Initialize min/max values with first waypoint
  const firstWaypoint = waypoints[0];
  const [firstLng, firstLat] = firstWaypoint.location.coordinates;
  
  let minLat = firstLat;
  let maxLat = firstLat;
  let minLng = firstLng;
  let maxLng = firstLng;
  
  // Find min/max lat/lng across all waypoints
  for (let i = 1; i < waypoints.length; i++) {
    const { location } = waypoints[i];
    const [longitude, latitude] = location.coordinates;
    
    minLat = Math.min(minLat, latitude);
    maxLat = Math.max(maxLat, latitude);
    minLng = Math.min(minLng, longitude);
    maxLng = Math.max(maxLng, longitude);
  }
  
  // Return as GeoTuple[] format: [SouthWest, NorthEast] where each is [latitude, longitude]
  const southWest: GeoTuple = [minLat, minLng];
  const northEast: GeoTuple = [maxLat, maxLng];
  
  return [southWest, northEast];
}
