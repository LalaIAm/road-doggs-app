// Firestore operation mappings for SyncActions
// Maps SyncAction types to Firestore SDK operations

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../infrastructure/api/firebase';
import { SyncAction, SyncActionType } from './types';
import { Waypoint } from '@roaddoggs/core/models/trip';

/**
 * Execute a sync action against Firestore
 * Maps SyncAction types to Firestore operations
 */
export async function executeSyncAction(action: SyncAction): Promise<void> {
  switch (action.type) {
    case 'ADD_STOP': {
      const { tripId, waypoint } = action.payload;
      const waypointsRef = collection(db, 'trips', tripId, 'waypoints');
      await addDoc(waypointsRef, {
        ...waypoint,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      break;
    }

    case 'UPDATE_TRIP': {
      const { tripId, updates } = action.payload;
      const tripRef = doc(db, 'trips', tripId);
      await updateDoc(tripRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      break;
    }

    case 'DELETE_STOP': {
      const { tripId, waypointId } = action.payload;
      const waypointRef = doc(db, 'trips', tripId, 'waypoints', waypointId);
      await deleteDoc(waypointRef);
      break;
    }

    case 'INVITE_USER': {
      const { tripId, userId, role } = action.payload;
      const tripRef = doc(db, 'trips', tripId);
      
      if (role === 'EDITOR') {
        await updateDoc(tripRef, {
          collaboratorIds: arrayUnion(userId),
          updatedAt: Timestamp.now(),
        });
      } else if (role === 'VIEWER') {
        await updateDoc(tripRef, {
          viewerIds: arrayUnion(userId),
          updatedAt: Timestamp.now(),
        });
      }
      break;
    }

    default:
      throw new Error(`Unknown sync action type: ${(action as any).type}`);
  }
}

/**
 * Check if an error is a terminal error that should trigger rollback
 * Terminal errors: Permission denied, not found, etc.
 */
export function isTerminalError(error: any): boolean {
  if (!error || !error.code) {
    return false;
  }

  // Firebase error codes that indicate terminal errors
  const terminalErrorCodes = [
    'permission-denied',
    'not-found',
    'invalid-argument',
    'failed-precondition',
    'unauthenticated',
  ];

  return terminalErrorCodes.includes(error.code);
}
