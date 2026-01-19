// Offline slice - manages sync queue and network status
// Based on TRD-20, TRD-156, TRD-163-176

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncAction, SyncStatus } from '../sync/types';

/**
 * Initial state for offline slice
 * As per TRD-156: offline slice must be whitelisted for persistence
 */
const initialState = {
  queue: [] as SyncAction[],
  status: 'IDLE' as SyncStatus,
  networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncAt: null as number | null,
  error: null as string | null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    /**
     * Update network status
     * As per TRD-172-173: Dispatch on window.offline/online events
     */
    networkStatusChanged: (state, action: PayloadAction<boolean>) => {
      state.networkStatus = action.payload;
      
      // Update status based on network and queue state
      if (!action.payload) {
        // Network went offline
        if (state.queue.length > 0) {
          state.status = 'PENDING_WRITES';
        } else {
          state.status = 'OFFLINE';
        }
      } else {
        // Network came online
        if (state.queue.length > 0) {
          state.status = 'PENDING_WRITES'; // Will transition to SYNCING when processing starts
        } else {
          state.status = 'IDLE';
        }
      }
    },

    /**
     * Add mutation to offline queue
     * As per TRD-20: Maintain OfflineMutationQueue in local store
     */
    addToQueue: (state, action: PayloadAction<SyncAction>) => {
      state.queue.push(action.payload);
      
      // Update status based on network state
      if (!state.networkStatus) {
        state.status = 'PENDING_WRITES';
      } else if (state.status === 'IDLE') {
        // If online and idle, will transition to SYNCING when processing starts
        state.status = 'PENDING_WRITES';
      }
    },

    /**
     * Remove mutation from queue (after successful sync)
     */
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter(item => item.id !== action.payload);
      
      // Update status if queue becomes empty
      if (state.queue.length === 0) {
        if (state.networkStatus) {
          state.status = 'IDLE';
        } else {
          state.status = 'OFFLINE';
        }
      }
    },

    /**
     * Update sync status
     * As per TRD-165-170: State machine transitions
     */
    setStatus: (state, action: PayloadAction<SyncStatus>) => {
      state.status = action.payload;
      
      // Clear error when transitioning away from ERROR state
      if (action.payload !== 'ERROR') {
        state.error = null;
      }
    },

    /**
     * Set error state
     * Used when sync fails with terminal error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'ERROR';
      }
    },

    /**
     * Update last sync timestamp
     */
    setLastSyncAt: (state, action: PayloadAction<number | null>) => {
      state.lastSyncAt = action.payload;
    },

    /**
     * Clear the entire queue
     * Used for rollback scenarios
     */
    clearQueue: (state) => {
      state.queue = [];
      if (state.networkStatus) {
        state.status = 'IDLE';
      } else {
        state.status = 'OFFLINE';
      }
    },

    /**
     * Increment retry count for a queued action
     */
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.queue.find(q => q.id === action.payload);
      if (item) {
        item.retryCount += 1;
      }
    },
  },
});

export const {
  networkStatusChanged,
  addToQueue,
  removeFromQueue,
  setStatus,
  setError,
  setLastSyncAt,
  clearQueue,
  incrementRetryCount,
} = offlineSlice.actions;

export default offlineSlice.reducer;
