// Sync Manager - orchestrates data flow between Redux, IndexedDB, and Firestore
// Based on TRD-163-176: Sync Manager (The Heart)

import { Store } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../store';
import { 
  networkStatusChanged, 
  addToQueue, 
  removeFromQueue, 
  setStatus, 
  setError,
  setLastSyncAt,
  incrementRetryCount,
  clearQueue,
} from '../slices/offlineSlice';
import { executeSyncAction, isTerminalError } from './firestoreOperations';
import { SyncAction, SyncStatus } from './types';
import { ConflictResolver } from './ConflictResolver';

/**
 * Retry configuration
 * As per TRD-21-23: Exponential backoff
 */
const RETRY_CONFIG = {
  baseDelay: 1000, // 1 second (T_base)
  maxDelay: 30000, // 30 seconds (T_cap)
};

/**
 * Calculate exponential backoff delay
 * Formula: T_wait = min(T_cap, T_base * 2^n)
 */
function calculateRetryDelay(retryCount: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Sync Manager class
 * Orchestrates offline-first synchronization
 */
export class SyncManager {
  private store: Store<RootState>;
  private dispatch: AppDispatch;
  private processingQueue: boolean = false;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(store: Store<RootState>) {
    this.store = store;
    this.dispatch = store.dispatch;

    // Set up network status listeners
    // As per TRD-172-173
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', this.handleOffline.bind(this));
      window.addEventListener('online', this.handleOnline.bind(this));
    }

    // Initialize status based on current network state
    const initialState = this.store.getState();
    if (!initialState.offline.networkStatus) {
      this.dispatch(networkStatusChanged(false));
    }

    // Process queue if there are pending items on initialization
    if (initialState.offline.queue.length > 0 && initialState.offline.networkStatus) {
      this.processMutationQueue();
    }
  }

  /**
   * Handle network going offline
   * As per TRD-172: Dispatch networkStatusChanged(false)
   */
  private handleOffline(): void {
    this.dispatch(networkStatusChanged(false));
    // Cancel any pending retries
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  /**
   * Handle network coming online
   * As per TRD-173: Dispatch networkStatusChanged(true) and trigger processMutationQueue
   */
  private handleOnline(): void {
    this.dispatch(networkStatusChanged(true));
    this.processMutationQueue();
  }

  /**
   * Add action to sync queue
   * Called when action.meta.sync === true and network is offline
   * As per TRD-176: Serialize action and push to offline.queue
   */
  public addToSyncQueue(action: SyncAction): void {
    this.dispatch(addToQueue(action));
  }

  /**
   * Process the mutation queue
   * Replays queued mutations to Firestore with exponential backoff retry
   */
  public async processMutationQueue(): Promise<void> {
    const state = this.store.getState();
    const { queue, networkStatus, status } = state.offline;

    // Don't process if already processing, offline, or no items in queue
    if (this.processingQueue || !networkStatus || queue.length === 0) {
      return;
    }

    // Don't process if status is ERROR (waiting for retry)
    if (status === 'ERROR' && this.retryTimeoutId) {
      return;
    }

    this.processingQueue = true;
    this.dispatch(setStatus('SYNCING'));

    try {
      // Process queue items sequentially
      for (const action of queue) {
        try {
          await executeSyncAction(action);
          
          // Success: remove from queue
          this.dispatch(removeFromQueue(action.id));
          this.dispatch(setLastSyncAt(Date.now()));
          
        } catch (error: any) {
          // Check if this is a terminal error
          if (isTerminalError(error)) {
            // Terminal error: use ConflictResolver to handle rollback
            // As per TRD-24: Rollback to last known server state
            console.error('Terminal sync error, resolving conflict:', error);
            
            const resolution = await this.conflictResolver.resolveConflict(action, error);
            
            if (resolution.resolved) {
              // Conflict resolved - remove from queue
              this.dispatch(removeFromQueue(action.id));
              
              if (resolution.rolledBack) {
                this.dispatch(setError('Sync failed: changes were rolled back due to conflict'));
              } else {
                this.dispatch(setError(null));
              }
            } else {
              // Resolution failed - clear queue and set error
              this.dispatch(setError(resolution.error || 'Sync failed with terminal error'));
              this.dispatch(clearQueue());
              break;
            }
            
            // Continue processing next item
            continue;
          }

          // Non-terminal error: try to resolve conflict first
          // If conflict resolution succeeds, remove from queue
          // Otherwise, increment retry count and schedule retry
          const resolution = await this.conflictResolver.resolveConflict(action, error);
          
          if (resolution.resolved && !resolution.rolledBack) {
            // Conflict resolved, server state accepted - remove from queue
            this.dispatch(removeFromQueue(action.id));
            this.dispatch(setLastSyncAt(Date.now()));
            continue;
          }
          
          // Conflict not resolved or rolled back - retry with exponential backoff
          this.dispatch(incrementRetryCount(action.id));
          
          const retryCount = action.retryCount + 1;
          const delay = calculateRetryDelay(retryCount);
          
          console.warn(`Sync failed for action ${action.id}, retrying in ${delay}ms (attempt ${retryCount})`);
          
          // Schedule retry
          this.dispatch(setStatus('ERROR'));
          this.dispatch(setError(`Retrying sync (attempt ${retryCount})...`));
          
          this.retryTimeoutId = setTimeout(() => {
            this.retryTimeoutId = null;
            this.processMutationQueue();
          }, delay);
          
          // Stop processing remaining items, will retry this one
          break;
        }
      }

      // Check if queue is now empty
      const newState = this.store.getState();
      if (newState.offline.queue.length === 0) {
        this.dispatch(setStatus('IDLE'));
        this.dispatch(setError(null));
      }

    } catch (error: any) {
      console.error('Error processing mutation queue:', error);
      this.dispatch(setStatus('ERROR'));
      this.dispatch(setError(error.message || 'Failed to process sync queue'));
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Cleanup: remove event listeners
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('offline', this.handleOffline.bind(this));
      window.removeEventListener('online', this.handleOnline.bind(this));
    }
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
}
