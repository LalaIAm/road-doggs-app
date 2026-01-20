// Conflict Resolver - handles server rejections and Last-Write-Wins (LWW) strategy
// Based on TRD-25-32: Concurrency & Conflict Resolution, TRD-24: Rollback on terminal errors

import { Store } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../store';
import { SyncAction, SyncActionType } from './types';
import { 
  doc, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../infrastructure/api/firebase';
import { updateTrip, removeTrip } from '../slices/tripSlice';
import { removeWaypoint, setWaypoints } from '../slices/waypointsSlice';
import { TripMetadata } from '@roaddoggs/core/models/trip';
import { Waypoint } from '@roaddoggs/core/models/trip';

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult {
  /** Whether the conflict was resolved */
  resolved: boolean;
  /** Whether a rollback was performed */
  rolledBack: boolean;
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Conflict Resolver class
 * Implements Last-Write-Wins (LWW) strategy for concurrent edits
 * As per TRD-25-32
 */
export class ConflictResolver {
  private store: Store<RootState>;
  private dispatch: AppDispatch;

  constructor(store: Store<RootState>) {
    this.store = store;
    this.dispatch = store.dispatch;
  }

  /**
   * Resolve a conflict for a rejected sync action
   * Applies LWW strategy: Accept if t_write > t_current (TRD-27-29)
   * 
   * @param action The sync action that was rejected
   * @param error The error from Firestore
   * @returns Conflict resolution result
   */
  async resolveConflict(
    action: SyncAction,
    error: any
  ): Promise<ConflictResolutionResult> {
    try {
      // For terminal errors (permission denied, not found), always rollback
      if (this.isTerminalError(error)) {
        return await this.rollbackOptimisticUpdate(action);
      }

      // For non-terminal errors, check if server has newer data (LWW)
      const serverState = await this.fetchServerState(action);
      
      if (!serverState) {
        // Server state not found - rollback
        return await this.rollbackOptimisticUpdate(action);
      }

      // Compare timestamps (LWW strategy)
      // As per TRD-26-29: For scalar fields, use server-side timestamps
      const serverTimestamp = this.extractTimestamp(serverState, action.type);
      const clientTimestamp = action.timestamp;

      if (serverTimestamp && serverTimestamp > clientTimestamp) {
        // Server has newer data - accept server version
        await this.acceptServerState(action, serverState);
        return {
          resolved: true,
          rolledBack: false,
        };
      } else {
        // Our write is newer or equal - but was rejected
        // This might be a permission issue or other conflict
        // Rollback optimistic update
        return await this.rollbackOptimisticUpdate(action);
      }
    } catch (resolveError: any) {
      console.error('Error resolving conflict:', resolveError);
      // If resolution fails, rollback to be safe
      return await this.rollbackOptimisticUpdate(action);
    }
  }

  /**
   * Rollback an optimistic update
   * Reverts local state to match server state
   * As per TRD-24: Rollback to last known server state
   */
  private async rollbackOptimisticUpdate(
    action: SyncAction
  ): Promise<ConflictResolutionResult> {
    try {
      // Fetch current server state
      const serverState = await this.fetchServerState(action);
      
      switch (action.type) {
        case 'UPDATE_TRIP': {
          const { tripId } = action.payload;
          
          if (serverState) {
            // Update with server state
            this.dispatch(updateTrip({
              id: tripId,
              ...(serverState as TripMetadata),
            }));
          } else {
            // Server state not found - remove from local state
            this.dispatch(removeTrip(tripId));
          }
          break;
        }

        case 'ADD_STOP': {
          const { tripId, waypoint } = action.payload;
          
          // Remove the optimistically added waypoint
          if (waypoint.id) {
            this.dispatch(removeWaypoint(waypoint.id));
          }
          
          // If server has waypoints, sync them
          if (serverState) {
            const waypoints = serverState as Waypoint[];
            this.dispatch(setWaypoints(waypoints));
          }
          break;
        }

        case 'DELETE_STOP': {
          const { tripId, waypointId } = action.payload;
          
          // If server still has the waypoint, restore it
          if (serverState) {
            const waypoint = serverState as Waypoint;
            // Restore waypoint (add it back)
            // Note: This would require an addWaypoint action, but for now we'll
            // just fetch all waypoints from server
            const allWaypoints = await this.fetchAllWaypoints(tripId);
            if (allWaypoints) {
              this.dispatch(setWaypoints(allWaypoints));
            }
          }
          break;
        }

        case 'INVITE_USER': {
          // For invites, just update trip with server state
          const { tripId } = action.payload;
          if (serverState) {
            this.dispatch(updateTrip({
              id: tripId,
              ...(serverState as TripMetadata),
            }));
          }
          break;
        }
      }

      return {
        resolved: true,
        rolledBack: true,
      };
    } catch (error: any) {
      console.error('Error rolling back optimistic update:', error);
      return {
        resolved: false,
        rolledBack: false,
        error: error.message || 'Failed to rollback',
      };
    }
  }

  /**
   * Accept server state and update local state
   * Used when server has newer data (LWW: server wins)
   */
  private async acceptServerState(
    action: SyncAction,
    serverState: any
  ): Promise<void> {
    switch (action.type) {
      case 'UPDATE_TRIP': {
        const { tripId } = action.payload;
        this.dispatch(updateTrip({
          id: tripId,
          ...(serverState as TripMetadata),
        }));
        break;
      }

      case 'ADD_STOP':
      case 'DELETE_STOP': {
        const { tripId } = action.payload;
        // Fetch all waypoints to sync state
        const waypoints = await this.fetchAllWaypoints(tripId);
        if (waypoints) {
          this.dispatch(setWaypoints(waypoints));
        }
        break;
      }

      case 'INVITE_USER': {
        const { tripId } = action.payload;
        this.dispatch(updateTrip({
          id: tripId,
          ...(serverState as TripMetadata),
        }));
        break;
      }
    }
  }

  /**
   * Fetch current server state for the resource affected by the action
   */
  private async fetchServerState(action: SyncAction): Promise<any | null> {
    try {
      switch (action.type) {
        case 'UPDATE_TRIP':
        case 'INVITE_USER': {
          const { tripId } = action.payload;
          const tripRef = doc(db, 'trips', tripId);
          const tripSnap = await getDoc(tripRef);
          
          if (!tripSnap.exists()) {
            return null;
          }
          
          return {
            id: tripSnap.id,
            ...tripSnap.data(),
          } as TripMetadata;
        }

        case 'ADD_STOP': {
          // For ADD_STOP, we need to fetch all waypoints to check if the waypoint was added
          // The waypoint might not have a server ID yet
          const { tripId } = action.payload;
          return await this.fetchAllWaypoints(tripId);
        }

        case 'DELETE_STOP': {
          const { tripId, waypointId } = action.payload;
          
          if (waypointId) {
            const waypointRef = doc(db, 'trips', tripId, 'waypoints', waypointId);
            const waypointSnap = await getDoc(waypointRef);
            
            if (!waypointSnap.exists()) {
              return null;
            }
            
            return {
              id: waypointSnap.id,
              ...waypointSnap.data(),
            } as Waypoint;
          }
          
          // If no waypointId, fetch all waypoints
          return await this.fetchAllWaypoints(tripId);
        }

        default:
          return null;
      }
    } catch (error: any) {
      console.error('Error fetching server state:', error);
      return null;
    }
  }

  /**
   * Fetch all waypoints for a trip
   */
  private async fetchAllWaypoints(tripId: string): Promise<Waypoint[] | null> {
    try {
      const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
      const waypointsRef = collection(db, 'trips', tripId, 'waypoints');
      const q = query(waypointsRef, orderBy('orderIndex', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const waypoints: Waypoint[] = [];
      querySnapshot.forEach((docSnap) => {
        waypoints.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Waypoint);
      });
      
      return waypoints;
    } catch (error: any) {
      console.error('Error fetching waypoints:', error);
      return null;
    }
  }

  /**
   * Extract timestamp from server state based on action type
   * As per TRD-26: For scalar fields, use server-side timestamps
   */
  private extractTimestamp(serverState: any, actionType: SyncActionType): number | null {
    if (!serverState) {
      return null;
    }

    // Firestore Timestamp objects have toMillis() method
    if (serverState.updatedAt) {
      const updatedAt = serverState.updatedAt;
      if (updatedAt?.toMillis) {
        return updatedAt.toMillis();
      }
      if (typeof updatedAt === 'number') {
        return updatedAt;
      }
    }

    // Fallback to createdAt if updatedAt not available
    if (serverState.createdAt) {
      const createdAt = serverState.createdAt;
      if (createdAt?.toMillis) {
        return createdAt.toMillis();
      }
      if (typeof createdAt === 'number') {
        return createdAt;
      }
    }

    return null;
  }

  /**
   * Check if error is a terminal error
   * Terminal errors always trigger rollback
   */
  private isTerminalError(error: any): boolean {
    if (!error || !error.code) {
      return false;
    }

    const terminalErrorCodes = [
      'permission-denied',
      'not-found',
      'invalid-argument',
      'failed-precondition',
      'unauthenticated',
    ];

    return terminalErrorCodes.includes(error.code);
  }
}
