/**
 * Firestore Trigger: onTripDelete
 * 
 * Background trigger that fires when a trip document is deleted.
 * Invokes CleanupEngine to recursively delete all subcollections.
 * 
 * Per TRD-238: onTripDelete trigger
 * Per TRD-239: Trigger: document('trips/{tripId}').onDelete
 * Per TRD-240: Responsibility: Recursive deletion strategy
 * 
 * @module apps/functions/src/triggers/firestore/onTripDelete
 */

import * as functions from 'firebase-functions';
import { deleteTripSubcollections } from '../../services/trip/CleanupEngine';
import { admin } from '../../config';

/**
 * Firestore trigger that fires when a trip document is deleted
 * 
 * Per TRD-239: Trigger: document('trips/{tripId}').onDelete
 * 
 * This trigger is called AFTER the trip document has been deleted.
 * It's responsible for cleaning up all subcollections (waypoints, chat, expenses).
 */
export const onTripDelete = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 540, // Per TRD-38: Background triggers have 540s timeout
    memory: '1GB',
  })
  .firestore.document('trips/{tripId}')
  .onDelete(async (snapshot, context) => {
    const tripId = context.params.tripId;
    
    functions.logger.info(`[onTripDelete] Trip deleted: ${tripId}`);
    
    try {
      // Get a reference to the trip document (even though it's deleted,
      // we can still use the reference to access subcollections)
      const tripRef = admin.firestore().collection('trips').doc(tripId);
      
      // Per TRD-240: Recursive deletion strategy
      // Delete all subcollections (waypoints, chat, expenses)
      await deleteTripSubcollections(tripRef);
      
      functions.logger.info(`[onTripDelete] Successfully cleaned up subcollections for trip: ${tripId}`);
    } catch (error: any) {
      functions.logger.error(`[onTripDelete] Error cleaning up trip ${tripId}:`, error);
      
      // Re-throw to mark the function as failed
      // This will cause Firebase to retry the function
      throw error;
    }
  });
