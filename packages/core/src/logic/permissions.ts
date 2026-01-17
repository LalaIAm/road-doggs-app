/**
 * Permissions Engine
 * 
 * Access Control Logic (ACL) functions for trip permissions.
 * Determines user permissions based on role (OWNER, EDITOR, VIEWER).
 * 
 * @module @roaddoggs/core/logic/permissions
 */

import type { UserProfile } from '../models/identity';
import type { TripMetadata } from '../models/trip';

/**
 * Determines if a user has edit permissions on a trip
 * 
 * Returns true if user is OWNER or EDITOR
 * - OWNER: user.uid === trip.ownerId
 * - EDITOR: trip.collaboratorIds.includes(user.uid)
 * 
 * @param {UserProfile | { uid: string }} user - The user to check permissions for
 * @param {TripMetadata} trip - The trip to check permissions on
 * @returns {boolean} - True if user can edit the trip
 */
export function canEdit(user: UserProfile | { uid: string }, trip: TripMetadata): boolean {
  const userId = user.uid;
  
  // OWNER can edit
  if (userId === trip.ownerId) {
    return true;
  }
  
  // EDITOR can edit (in collaboratorIds)
  if (trip.collaboratorIds.includes(userId)) {
    return true;
  }
  
  // VIEWER cannot edit
  return false;
}

/**
 * Determines if a user has delete permissions on a trip
 * 
 * Returns true only if user is OWNER
 * - OWNER: user.uid === trip.ownerId
 * 
 * @param {UserProfile | { uid: string }} user - The user to check permissions for
 * @param {TripMetadata} trip - The trip to check permissions on
 * @returns {boolean} - True if user can delete the trip
 */
export function canDelete(user: UserProfile | { uid: string }, trip: TripMetadata): boolean {
  const userId = user.uid;
  
  // Only OWNER can delete
  return userId === trip.ownerId;
}

/**
 * Determines if a user can invite others to a trip
 * 
 * Returns true only if user is OWNER
 * - OWNER: user.uid === trip.ownerId
 * 
 * @param {UserProfile | { uid: string }} user - The user to check permissions for
 * @param {TripMetadata} trip - The trip to check permissions on
 * @returns {boolean} - True if user can invite others to the trip
 */
export function canInvite(user: UserProfile | { uid: string }, trip: TripMetadata): boolean {
  const userId = user.uid;
  
  // Only OWNER can invite
  return userId === trip.ownerId;
}
