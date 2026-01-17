/**
 * Firestore Security Rules Tests
 * 
 * Tests Firestore security rules using @firebase/rules-unit-testing
 * Verifies RBAC (isOwner, canEdit) and data validation rules.
 * 
 * Per TRD-310: Security Rules testing
 * 
 * @module tests/firestore.test
 */

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

// Test user IDs
const OWNER_ID = 'owner-user-id';
const COLLABORATOR_ID = 'collaborator-user-id';
const VIEWER_ID = 'viewer-user-id';
const OTHER_USER_ID = 'other-user-id';
const TRIP_ID = 'test-trip-id';
const WAYPOINT_ID = 'test-waypoint-id';

// Test data
const validTripData = {
  ownerId: OWNER_ID,
  title: 'My Test Trip',
  collaboratorIds: [COLLABORATOR_ID],
  viewerIds: [VIEWER_ID],
  status: 'DRAFT',
  dates: {
    start: { seconds: 1735689600, nanoseconds: 0 }, // 2025-01-01
    end: { seconds: 1735776000, nanoseconds: 0 },   // 2025-01-02
  },
  bounds: [[36.0, -115.0], [37.0, -114.0]],
};

const validWaypointData = {
  tripId: TRIP_ID,
  location: {
    type: 'Point',
    coordinates: [-115.0, 36.0],
  },
  placeId: 'test-place-id',
  type: 'STOP',
  orderIndex: 0,
  locked: false,
  notes: 'Test waypoint',
};

beforeAll(async () => {
  // Read firestore.rules file
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  // Initialize test environment with rules
  // When using `firebase emulators:exec`, the emulator host/port are auto-detected
  // Otherwise, specify manually via FIRESTORE_EMULATOR_HOST environment variable
  const firestoreConfig: any = { rules };
  
  // If FIRESTORE_EMULATOR_HOST is set, use it (format: "host:port")
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    firestoreConfig.host = host;
    firestoreConfig.port = parseInt(port, 10);
  }

  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: firestoreConfig,
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

afterEach(async () => {
  // Clean up test data after each test
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Firestore Security Rules - Trips Collection', () => {
  describe('Read Access', () => {
    it('should allow owner to read their trip', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Create trip as owner
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
      
      // Owner should be able to read
      const doc = await ownerContext.firestore().collection('trips').doc(TRIP_ID).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.title).toBe('My Test Trip');
    });

    it('should allow collaborator to read trip', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const collaboratorContext = testEnv.authenticatedContext(COLLABORATOR_ID);
      
      // Create trip as owner
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
      
      // Collaborator should be able to read
      const doc = await collaboratorContext.firestore().collection('trips').doc(TRIP_ID).get();
      expect(doc.exists).toBe(true);
    });

    it('should allow viewer to read trip', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const viewerContext = testEnv.authenticatedContext(VIEWER_ID);
      
      // Create trip as owner
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
      
      // Viewer should be able to read
      const doc = await viewerContext.firestore().collection('trips').doc(TRIP_ID).get();
      expect(doc.exists).toBe(true);
    });

    it('should deny unauthenticated user from reading trip', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      
      // Create trip as owner
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
      
      // Unauthenticated user should not be able to read
      await expect(
        unauthenticatedContext.firestore().collection('trips').doc(TRIP_ID).get()
      ).rejects.toThrow();
    });

    it('should deny other user from reading trip they are not part of', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const otherContext = testEnv.authenticatedContext(OTHER_USER_ID);
      
      // Create trip as owner
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
      
      // Other user should not be able to read
      await expect(
        otherContext.firestore().collection('trips').doc(TRIP_ID).get()
      ).rejects.toThrow();
    });
  });

  describe('Create Access', () => {
    it('should allow authenticated user to create trip with valid data', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Should succeed with valid data
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData)
      ).resolves.not.toThrow();
    });

    it('should reject trip creation with title too short (< 3 chars)', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const invalidData = {
        ...validTripData,
        title: 'AB', // Only 2 characters
      };
      
      // Should fail validation
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).set(invalidData)
      ).rejects.toThrow();
    });

    it('should reject trip creation with wrong ownerId', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const invalidData = {
        ...validTripData,
        ownerId: OTHER_USER_ID, // Wrong owner
      };
      
      // Should fail - ownerId must match authenticated user
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).set(invalidData)
      ).rejects.toThrow();
    });

    it('should reject unauthenticated trip creation', async () => {
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      
      // Should fail - must be authenticated
      await expect(
        unauthenticatedContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData)
      ).rejects.toThrow();
    });
  });

  describe('Update Access', () => {
    beforeEach(async () => {
      // Create trip as owner before each update test
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
    });

    it('should allow owner to update trip', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Owner should be able to update
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).update({
          title: 'Updated Trip Title',
        })
      ).resolves.not.toThrow();
    });

    it('should allow collaborator to update trip', async () => {
      const collaboratorContext = testEnv.authenticatedContext(COLLABORATOR_ID);
      
      // Collaborator should be able to update (canEdit)
      await expect(
        collaboratorContext.firestore().collection('trips').doc(TRIP_ID).update({
          title: 'Updated by Collaborator',
        })
      ).resolves.not.toThrow();
    });

    it('should deny viewer from updating trip', async () => {
      const viewerContext = testEnv.authenticatedContext(VIEWER_ID);
      
      // Viewer should NOT be able to update (read-only)
      await expect(
        viewerContext.firestore().collection('trips').doc(TRIP_ID).update({
          title: 'Updated by Viewer',
        })
      ).rejects.toThrow();
    });

    it('should deny other user from updating trip', async () => {
      const otherContext = testEnv.authenticatedContext(OTHER_USER_ID);
      
      // Other user should NOT be able to update
      await expect(
        otherContext.firestore().collection('trips').doc(TRIP_ID).update({
          title: 'Updated by Other',
        })
      ).rejects.toThrow();
    });

    it('should reject update with invalid title (too short)', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Should fail validation
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).update({
          title: 'AB', // Only 2 characters
        })
      ).rejects.toThrow();
    });

    it('should prevent changing ownerId', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Should fail - cannot change ownerId
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).update({
          ownerId: OTHER_USER_ID,
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Access', () => {
    beforeEach(async () => {
      // Create trip as owner before each delete test
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
    });

    it('should allow owner to delete trip', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Owner should be able to delete
      await expect(
        ownerContext.firestore().collection('trips').doc(TRIP_ID).delete()
      ).resolves.not.toThrow();
    });

    it('should deny collaborator from deleting trip', async () => {
      const collaboratorContext = testEnv.authenticatedContext(COLLABORATOR_ID);
      
      // Collaborator should NOT be able to delete (only owner)
      await expect(
        collaboratorContext.firestore().collection('trips').doc(TRIP_ID).delete()
      ).rejects.toThrow();
    });

    it('should deny viewer from deleting trip', async () => {
      const viewerContext = testEnv.authenticatedContext(VIEWER_ID);
      
      // Viewer should NOT be able to delete
      await expect(
        viewerContext.firestore().collection('trips').doc(TRIP_ID).delete()
      ).rejects.toThrow();
    });
  });
});

describe('Firestore Security Rules - Waypoints Subcollection', () => {
  beforeEach(async () => {
    // Create trip as owner before waypoint tests
    const ownerContext = testEnv.authenticatedContext(OWNER_ID);
    await ownerContext.firestore().collection('trips').doc(TRIP_ID).set(validTripData);
  });

  describe('Read Access', () => {
    it('should allow owner to read waypoint', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Create waypoint
      await ownerContext
        .firestore()
        .collection('trips')
        .doc(TRIP_ID)
        .collection('waypoints')
        .doc(WAYPOINT_ID)
        .set(validWaypointData);
      
      // Owner should be able to read
      const doc = await ownerContext
        .firestore()
        .collection('trips')
        .doc(TRIP_ID)
        .collection('waypoints')
        .doc(WAYPOINT_ID)
        .get();
      
      expect(doc.exists).toBe(true);
    });

    it('should allow collaborator to read waypoint', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const collaboratorContext = testEnv.authenticatedContext(COLLABORATOR_ID);
      
      // Create waypoint as owner
      await ownerContext
        .firestore()
        .collection('trips')
        .doc(TRIP_ID)
        .collection('waypoints')
        .doc(WAYPOINT_ID)
        .set(validWaypointData);
      
      // Collaborator should be able to read
      const doc = await collaboratorContext
        .firestore()
        .collection('trips')
        .doc(TRIP_ID)
        .collection('waypoints')
        .doc(WAYPOINT_ID)
        .get();
      
      expect(doc.exists).toBe(true);
    });

    it('should deny other user from reading waypoint', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      const otherContext = testEnv.authenticatedContext(OTHER_USER_ID);
      
      // Create waypoint as owner
      await ownerContext
        .firestore()
        .collection('trips')
        .doc(TRIP_ID)
        .collection('waypoints')
        .doc(WAYPOINT_ID)
        .set(validWaypointData);
      
      // Other user should NOT be able to read
      await expect(
        otherContext
          .firestore()
          .collection('trips')
          .doc(TRIP_ID)
          .collection('waypoints')
          .doc(WAYPOINT_ID)
          .get()
      ).rejects.toThrow();
    });
  });

  describe('Write Access', () => {
    it('should allow owner to create waypoint', async () => {
      const ownerContext = testEnv.authenticatedContext(OWNER_ID);
      
      // Owner should be able to create waypoint
      await expect(
        ownerContext
          .firestore()
          .collection('trips')
          .doc(TRIP_ID)
          .collection('waypoints')
          .doc(WAYPOINT_ID)
          .set(validWaypointData)
      ).resolves.not.toThrow();
    });

    it('should allow collaborator to create waypoint', async () => {
      const collaboratorContext = testEnv.authenticatedContext(COLLABORATOR_ID);
      
      // Collaborator should be able to create waypoint (canEdit parent trip)
      await expect(
        collaboratorContext
          .firestore()
          .collection('trips')
          .doc(TRIP_ID)
          .collection('waypoints')
          .doc(WAYPOINT_ID)
          .set(validWaypointData)
      ).resolves.not.toThrow();
    });

    it('should deny viewer from creating waypoint', async () => {
      const viewerContext = testEnv.authenticatedContext(VIEWER_ID);
      
      // Viewer should NOT be able to create waypoint (read-only)
      await expect(
        viewerContext
          .firestore()
          .collection('trips')
          .doc(TRIP_ID)
          .collection('waypoints')
          .doc(WAYPOINT_ID)
          .set(validWaypointData)
      ).rejects.toThrow();
    });

    it('should deny other user from creating waypoint', async () => {
      const otherContext = testEnv.authenticatedContext(OTHER_USER_ID);
      
      // Other user should NOT be able to create waypoint
      await expect(
        otherContext
          .firestore()
          .collection('trips')
          .doc(TRIP_ID)
          .collection('waypoints')
          .doc(WAYPOINT_ID)
          .set(validWaypointData)
      ).rejects.toThrow();
    });
  });
});
