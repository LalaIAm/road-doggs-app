/**
 * Trip Models
 * 
 * Type definitions for trip metadata and waypoints.
 * These models define the structure of trip data in the RoadDoggs system.
 * 
 * @module @roaddoggs/core/models/trip
 */

/**
 * Trip status enumeration
 * Represents the current state of a trip
 */
export enum TripStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Waypoint type enumeration
 * Represents the type/category of a waypoint
 */
export enum WaypointType {
  ORIGIN = 'ORIGIN',
  DESTINATION = 'DESTINATION',
  STOP = 'STOP',
  POI = 'POI',
}

/**
 * Geographic coordinate tuple
 * [latitude, longitude]
 * 
 * @type GeoTuple
 */
export type GeoTuple = [number, number];

/**
 * GeoJSON Point geometry
 * Standard GeoJSON Point type for geographic locations
 * 
 * @interface GeoJSONPoint
 */
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] per GeoJSON spec
}

/**
 * Timestamp type
 * Represents a point in time (can be Firebase Timestamp or number)
 * For isomorphic code, we use a flexible type that works in both environments
 * 
 * @type Timestamp
 */
export type Timestamp = number | Date | { seconds: number; nanoseconds: number };

/**
 * Trip date range
 * Start and end timestamps for the trip
 * 
 * @interface TripDates
 */
export interface TripDates {
  start: Timestamp;
  end: Timestamp;
}

/**
 * Trip Metadata
 * Core information about a trip including ownership, collaboration, and status
 * 
 * @interface TripMetadata
 */
export interface TripMetadata {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Owner user ID (reference to UserProfile.uid) */
  ownerId: string;
  
  /** User-defined trip title */
  title: string;
  
  /** Array of user IDs with write access */
  collaboratorIds: string[];
  
  /** Array of user IDs with read-only access */
  viewerIds: string[];
  
  /** Current trip status */
  status: TripStatus;
  
  /** Trip date range (start and end timestamps) */
  dates: TripDates;
  
  /** Geographic bounds as array of coordinate tuples [SW, NE] */
  bounds: GeoTuple[];
}

/**
 * Waypoint
 * A specific location point on a trip route
 * 
 * @interface Waypoint
 */
export interface Waypoint {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Parent trip ID (foreign key to TripMetadata.id) */
  tripId: string;
  
  /** Geographic location as GeoJSON Point */
  location: GeoJSONPoint;
  
  /** Google Maps Place ID */
  placeId: string;
  
  /** Waypoint type/category */
  type: WaypointType;
  
  /** Sorting key for ordering waypoints in the route */
  orderIndex: number;
  
  /** Flag to prevent automatic optimization/reordering */
  locked: boolean;
  
  /** User-provided notes/annotations */
  notes: string;
}
