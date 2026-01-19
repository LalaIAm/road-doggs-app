// Sync-related types and interfaces
// Based on TRD-96-103: Sync Models

/**
 * Sync action types that can be queued for offline synchronization
 * As per TRD-97
 */
export type SyncActionType = 'ADD_STOP' | 'UPDATE_TRIP' | 'DELETE_STOP' | 'INVITE_USER';

/**
 * Sync action interface for offline mutation queue
 * As per TRD-98-103
 */
export interface SyncAction {
  /** Unique mutation ID */
  id: string;
  
  /** Action type discriminator */
  type: SyncActionType;
  
  /** The data payload for the action */
  payload: any;
  
  /** Creation time (epoch milliseconds) */
  timestamp: number;
  
  /** Retry count for exponential backoff */
  retryCount: number;
}

/**
 * Sync status state machine values
 * As per TRD-165-170
 */
export type SyncStatus = 'IDLE' | 'OFFLINE' | 'PENDING_WRITES' | 'SYNCING' | 'ERROR';
