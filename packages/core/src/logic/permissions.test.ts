/**
 * Unit Tests for Permissions Logic
 * 
 * Tests Access Control Logic (ACL) functions for all role combinations.
 * Validates that permissions matrix returns correct booleans per TRD-333.
 * 
 * @module @roaddoggs/core/logic/permissions.test
 */

import { describe, it, expect } from 'vitest';
import { canEdit, canDelete, canInvite } from './permissions';
import type { UserProfile } from '../models/identity';
import type { TripMetadata } from '../models/trip';
import { TripStatus } from '../models/trip';

/**
 * Helper: Create a minimal mock user with just uid
 */
function createMockUser(uid: string): { uid: string } {
  return { uid };
}

/**
 * Helper: Create a full mock UserProfile
 */
function createMockUserProfile(uid: string): UserProfile {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: `User ${uid}`,
    photoURL: `https://example.com/photo/${uid}.jpg`,
    preferences: {
      nature: true,
      culture: false,
      foodie: true,
      budget: 'MID' as const,
      rvProfile: null,
    },
  };
}

/**
 * Helper: Create a mock TripMetadata
 */
function createMockTrip(
  ownerId: string,
  collaboratorIds: string[] = [],
  viewerIds: string[] = []
): TripMetadata {
  return {
    id: 'trip-123',
    ownerId,
    title: 'Test Trip',
    collaboratorIds,
    viewerIds,
    status: TripStatus.DRAFT,
    dates: {
      start: new Date('2025-06-01'),
      end: new Date('2025-06-15'),
    },
    bounds: [
      [-122.5, 37.5],
      [-122.0, 38.0],
    ],
  };
}

describe('Permissions Logic', () => {
  const OWNER_ID = 'user-owner';
  const EDITOR_ID = 'user-editor';
  const VIEWER_ID = 'user-viewer';
  const NON_PARTICIPANT_ID = 'user-stranger';

  describe('canEdit(user, trip)', () => {
    it('should return true if user is OWNER (via ownerId)', () => {
      const user = createMockUser(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canEdit(user, trip)).toBe(true);
    });

    it('should return true if user is OWNER (with full UserProfile)', () => {
      const user = createMockUserProfile(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canEdit(user, trip)).toBe(true);
    });

    it('should return true if user is EDITOR (in collaboratorIds)', () => {
      const user = createMockUser(EDITOR_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canEdit(user, trip)).toBe(true);
    });

    it('should return true if user is EDITOR (with multiple collaborators)', () => {
      const user = createMockUser(EDITOR_ID);
      const trip = createMockTrip(OWNER_ID, ['other-editor', EDITOR_ID, 'another-editor'], [VIEWER_ID]);

      expect(canEdit(user, trip)).toBe(true);
    });

    it('should return false if user is VIEWER (in viewerIds only)', () => {
      const user = createMockUser(VIEWER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canEdit(user, trip)).toBe(false);
    });

    it('should return false if user is non-participant', () => {
      const user = createMockUser(NON_PARTICIPANT_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canEdit(user, trip)).toBe(false);
    });

    it('should return false if user is non-participant (empty arrays)', () => {
      const user = createMockUser(NON_PARTICIPANT_ID);
      const trip = createMockTrip(OWNER_ID, [], []);

      expect(canEdit(user, trip)).toBe(false);
    });

    it('should return true if user is OWNER even if also in collaboratorIds', () => {
      const user = createMockUser(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [OWNER_ID, EDITOR_ID], [VIEWER_ID]);

      // Owner should have edit permissions regardless of being in collaboratorIds
      expect(canEdit(user, trip)).toBe(true);
    });

    it('should return false if user is in viewerIds but not collaboratorIds', () => {
      const user = createMockUser(VIEWER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID, 'other-viewer']);

      expect(canEdit(user, trip)).toBe(false);
    });
  });

  describe('canDelete(user, trip)', () => {
    it('should return true if user is OWNER', () => {
      const user = createMockUser(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canDelete(user, trip)).toBe(true);
    });

    it('should return true if user is OWNER (with full UserProfile)', () => {
      const user = createMockUserProfile(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canDelete(user, trip)).toBe(true);
    });

    it('should return false if user is EDITOR', () => {
      const user = createMockUser(EDITOR_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canDelete(user, trip)).toBe(false);
    });

    it('should return false if user is VIEWER', () => {
      const user = createMockUser(VIEWER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canDelete(user, trip)).toBe(false);
    });

    it('should return false if user is non-participant', () => {
      const user = createMockUser(NON_PARTICIPANT_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canDelete(user, trip)).toBe(false);
    });

    it('should return false if user is non-participant (empty arrays)', () => {
      const user = createMockUser(NON_PARTICIPANT_ID);
      const trip = createMockTrip(OWNER_ID, [], []);

      expect(canDelete(user, trip)).toBe(false);
    });

    it('should return true only if user.uid === trip.ownerId', () => {
      const user = createMockUser(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [OWNER_ID], [OWNER_ID]);

      // Even if owner is in collaboratorIds or viewerIds, only ownerId check matters
      expect(canDelete(user, trip)).toBe(true);
    });

    it('should return false if user matches editor but not owner', () => {
      const user = createMockUser(EDITOR_ID);
      const trip = createMockTrip('different-owner', [EDITOR_ID], []);

      expect(canDelete(user, trip)).toBe(false);
    });
  });

  describe('canInvite(user, trip)', () => {
    it('should return true if user is OWNER', () => {
      const user = createMockUser(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canInvite(user, trip)).toBe(true);
    });

    it('should return true if user is OWNER (with full UserProfile)', () => {
      const user = createMockUserProfile(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canInvite(user, trip)).toBe(true);
    });

    it('should return false if user is EDITOR', () => {
      const user = createMockUser(EDITOR_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canInvite(user, trip)).toBe(false);
    });

    it('should return false if user is VIEWER', () => {
      const user = createMockUser(VIEWER_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canInvite(user, trip)).toBe(false);
    });

    it('should return false if user is non-participant', () => {
      const user = createMockUser(NON_PARTICIPANT_ID);
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      expect(canInvite(user, trip)).toBe(false);
    });

    it('should return false if user is non-participant (empty arrays)', () => {
      const user = createMockUser(NON_PARTICIPANT_ID);
      const trip = createMockTrip(OWNER_ID, [], []);

      expect(canInvite(user, trip)).toBe(false);
    });

    it('should return true only if user.uid === trip.ownerId', () => {
      const user = createMockUser(OWNER_ID);
      const trip = createMockTrip(OWNER_ID, [OWNER_ID], [OWNER_ID]);

      // Even if owner is in collaboratorIds or viewerIds, only ownerId check matters
      expect(canInvite(user, trip)).toBe(true);
    });

    it('should return false if user matches editor but not owner', () => {
      const user = createMockUser(EDITOR_ID);
      const trip = createMockTrip('different-owner', [EDITOR_ID], []);

      expect(canInvite(user, trip)).toBe(false);
    });
  });

  describe('Permissions Matrix Verification (TRD-333)', () => {
    it('should correctly enforce ACL matrix for all role combinations', () => {
      const trip = createMockTrip(OWNER_ID, [EDITOR_ID], [VIEWER_ID]);

      // OWNER permissions
      expect(canEdit(createMockUser(OWNER_ID), trip)).toBe(true);
      expect(canDelete(createMockUser(OWNER_ID), trip)).toBe(true);
      expect(canInvite(createMockUser(OWNER_ID), trip)).toBe(true);

      // EDITOR permissions
      expect(canEdit(createMockUser(EDITOR_ID), trip)).toBe(true);
      expect(canDelete(createMockUser(EDITOR_ID), trip)).toBe(false);
      expect(canInvite(createMockUser(EDITOR_ID), trip)).toBe(false);

      // VIEWER permissions
      expect(canEdit(createMockUser(VIEWER_ID), trip)).toBe(false);
      expect(canDelete(createMockUser(VIEWER_ID), trip)).toBe(false);
      expect(canInvite(createMockUser(VIEWER_ID), trip)).toBe(false);

      // Non-participant permissions
      expect(canEdit(createMockUser(NON_PARTICIPANT_ID), trip)).toBe(false);
      expect(canDelete(createMockUser(NON_PARTICIPANT_ID), trip)).toBe(false);
      expect(canInvite(createMockUser(NON_PARTICIPANT_ID), trip)).toBe(false);
    });
  });
});
