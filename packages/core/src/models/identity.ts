/**
 * Identity Models
 *
 * Type definitions for user identity, preferences, and vehicle profiles.
 * These models define the structure of user data in the RoadDoggs system.
 *
 * @module @roaddoggs/core/models/identity
 */

/**
 * Budget level enumeration
 * Represents the user's budget preference for travel
 */
export enum Budget {
  LOW = "LOW",
  MID = "MID",
  HIGH = "HIGH",
}

/**
 * Vehicle fuel type enumeration
 * Represents the type of fuel the vehicle uses
 */
export enum FuelType {
  GAS = "GAS",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
}

/**
 * RV/Vehicle Profile
 * Optional vehicle constraints for route planning
 *
 * @interface RvProfile
 */
export interface RvProfile {
  /** Vehicle height in meters */
  height: number;

  /** Vehicle weight in kilograms */
  weight: number;

  /** Type of fuel the vehicle uses */
  fuelType: FuelType;
}

/**
 * User Preferences
 * User travel preferences across multiple dimensions
 *
 * @interface UserPreferences
 */
export interface UserPreferences {
  /** Preference for nature/outdoor activities */
  nature: boolean;

  /** Preference for culture/historical sites */
  culture: boolean;

  /** Preference for food/dining experiences */
  foodie: boolean;

  /** Budget level preference */
  budget: Budget;

  /** Optional RV/vehicle profile for route constraints */
  rvProfile: RvProfile | null;
}

/**
 * User Profile
 * Complete user identity and preference data
 *
 * @interface UserProfile
 */
export interface UserProfile {
  /** Unique identifier (UID) */
  uid: string;

  /** User email address */
  email: string;

  /** Public display name */
  displayName: string;

  /** Avatar/profile photo URL */
  photoURL: string;

  /** User travel preferences */
  preferences: UserPreferences;
}
