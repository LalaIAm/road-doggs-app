// Unit tests for offlineSlice - Mutation Queue functionality
// Tests TRD-20: OfflineMutationQueue behavior

import { describe, it, expect, beforeEach } from 'vitest';
import offlineReducer, {
  addToQueue,
  removeFromQueue,
  networkStatusChanged,
  setStatus,
  setError,
  clearQueue,
  incrementRetryCount,
  setLastSyncAt,
} from './offlineSlice';
import { SyncAction } from '../sync/types';

describe('offlineSlice - Mutation Queue', () => {
  const initialState = {
    queue: [],
    status: 'IDLE' as const,
    networkStatus: true,
    lastSyncAt: null,
    error: null,
  };

  const createSyncAction = (id: string, type: string = 'UPDATE_TRIP'): SyncAction => ({
    id,
    type: type as any,
    payload: { tripId: 'trip-1', updates: { title: 'Test Trip' } },
    timestamp: Date.now(),
    retryCount: 0,
  });

  describe('addToQueue', () => {
    it('should add action to queue', () => {
      const action = createSyncAction('sync-1');
      const state = offlineReducer(initialState, addToQueue(action));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0]).toEqual(action);
    });

    it('should maintain FIFO order when adding multiple actions', () => {
      const action1 = createSyncAction('sync-1');
      const action2 = createSyncAction('sync-2');
      const action3 = createSyncAction('sync-3');

      let state = offlineReducer(initialState, addToQueue(action1));
      state = offlineReducer(state, addToQueue(action2));
      state = offlineReducer(state, addToQueue(action3));

      expect(state.queue).toHaveLength(3);
      expect(state.queue[0].id).toBe('sync-1');
      expect(state.queue[1].id).toBe('sync-2');
      expect(state.queue[2].id).toBe('sync-3');
    });

    it('should update status to PENDING_WRITES when offline and queue has items', () => {
      const offlineState = { ...initialState, networkStatus: false };
      const action = createSyncAction('sync-1');
      const state = offlineReducer(offlineState, addToQueue(action));

      expect(state.status).toBe('PENDING_WRITES');
    });

    it('should update status to PENDING_WRITES when online and idle', () => {
      const action = createSyncAction('sync-1');
      const state = offlineReducer(initialState, addToQueue(action));

      expect(state.status).toBe('PENDING_WRITES');
    });
  });

  describe('removeFromQueue', () => {
    it('should remove action from queue by ID', () => {
      const action1 = createSyncAction('sync-1');
      const action2 = createSyncAction('sync-2');
      const action3 = createSyncAction('sync-3');

      let state = offlineReducer(initialState, addToQueue(action1));
      state = offlineReducer(state, addToQueue(action2));
      state = offlineReducer(state, addToQueue(action3));

      // Remove middle item
      state = offlineReducer(state, removeFromQueue('sync-2'));

      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].id).toBe('sync-1');
      expect(state.queue[1].id).toBe('sync-3');
    });

    it('should update status to IDLE when queue becomes empty and online', () => {
      const action = createSyncAction('sync-1');
      let state = offlineReducer(initialState, addToQueue(action));
      state = offlineReducer(state, removeFromQueue('sync-1'));

      expect(state.queue).toHaveLength(0);
      expect(state.status).toBe('IDLE');
    });

    it('should update status to OFFLINE when queue becomes empty and offline', () => {
      const offlineState = { ...initialState, networkStatus: false };
      const action = createSyncAction('sync-1');
      let state = offlineReducer(offlineState, addToQueue(action));
      state = offlineReducer(state, removeFromQueue('sync-1'));

      expect(state.queue).toHaveLength(0);
      expect(state.status).toBe('OFFLINE');
    });

    it('should not remove non-existent action', () => {
      const action = createSyncAction('sync-1');
      let state = offlineReducer(initialState, addToQueue(action));
      const queueLength = state.queue.length;
      
      state = offlineReducer(state, removeFromQueue('non-existent'));

      expect(state.queue).toHaveLength(queueLength);
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count for specific action', () => {
      const action = createSyncAction('sync-1');
      let state = offlineReducer(initialState, addToQueue(action));
      
      expect(state.queue[0].retryCount).toBe(0);
      
      state = offlineReducer(state, incrementRetryCount('sync-1'));
      expect(state.queue[0].retryCount).toBe(1);
      
      state = offlineReducer(state, incrementRetryCount('sync-1'));
      expect(state.queue[0].retryCount).toBe(2);
    });

    it('should not increment retry count for non-existent action', () => {
      const action = createSyncAction('sync-1');
      let state = offlineReducer(initialState, addToQueue(action));
      
      state = offlineReducer(state, incrementRetryCount('non-existent'));
      
      expect(state.queue[0].retryCount).toBe(0);
    });
  });

  describe('clearQueue', () => {
    it('should clear all items from queue', () => {
      const action1 = createSyncAction('sync-1');
      const action2 = createSyncAction('sync-2');
      const action3 = createSyncAction('sync-3');

      let state = offlineReducer(initialState, addToQueue(action1));
      state = offlineReducer(state, addToQueue(action2));
      state = offlineReducer(state, addToQueue(action3));

      expect(state.queue).toHaveLength(3);

      state = offlineReducer(state, clearQueue());

      expect(state.queue).toHaveLength(0);
      expect(state.status).toBe('IDLE');
    });

    it('should set status to OFFLINE when clearing queue while offline', () => {
      const offlineState = { ...initialState, networkStatus: false };
      const action = createSyncAction('sync-1');
      let state = offlineReducer(offlineState, addToQueue(action));
      state = offlineReducer(state, clearQueue());

      expect(state.queue).toHaveLength(0);
      expect(state.status).toBe('OFFLINE');
    });
  });

  describe('networkStatusChanged', () => {
    it('should update network status to offline and set status to OFFLINE when queue is empty', () => {
      const state = offlineReducer(initialState, networkStatusChanged(false));

      expect(state.networkStatus).toBe(false);
      expect(state.status).toBe('OFFLINE');
    });

    it('should update network status to offline and set status to PENDING_WRITES when queue has items', () => {
      const action = createSyncAction('sync-1');
      let state = offlineReducer(initialState, addToQueue(action));
      state = offlineReducer(state, networkStatusChanged(false));

      expect(state.networkStatus).toBe(false);
      expect(state.status).toBe('PENDING_WRITES');
    });

    it('should update network status to online and set status to IDLE when queue is empty', () => {
      const offlineState = { ...initialState, networkStatus: false, status: 'OFFLINE' as const };
      const state = offlineReducer(offlineState, networkStatusChanged(true));

      expect(state.networkStatus).toBe(true);
      expect(state.status).toBe('IDLE');
    });

    it('should update network status to online and set status to PENDING_WRITES when queue has items', () => {
      const offlineState = { ...initialState, networkStatus: false, status: 'OFFLINE' as const };
      const action = createSyncAction('sync-1');
      let state = offlineReducer(offlineState, addToQueue(action));
      state = offlineReducer(state, networkStatusChanged(true));

      expect(state.networkStatus).toBe(true);
      expect(state.status).toBe('PENDING_WRITES');
    });
  });

  describe('setStatus', () => {
    it('should update sync status', () => {
      const state = offlineReducer(initialState, setStatus('SYNCING'));

      expect(state.status).toBe('SYNCING');
    });

    it('should clear error when transitioning away from ERROR state', () => {
      const errorState = { ...initialState, status: 'ERROR' as const, error: 'Some error' };
      const state = offlineReducer(errorState, setStatus('IDLE'));

      expect(state.status).toBe('IDLE');
      expect(state.error).toBe(null);
    });

    it('should not clear error when transitioning to ERROR state', () => {
      const state = offlineReducer(initialState, setStatus('ERROR'));

      expect(state.status).toBe('ERROR');
      // Error should remain as set (or null if not explicitly set)
    });
  });

  describe('setError', () => {
    it('should set error and update status to ERROR', () => {
      const state = offlineReducer(initialState, setError('Test error'));

      expect(state.error).toBe('Test error');
      expect(state.status).toBe('ERROR');
    });

    it('should clear error when set to null', () => {
      const errorState = { ...initialState, status: 'ERROR' as const, error: 'Some error' };
      const state = offlineReducer(errorState, setError(null));

      expect(state.error).toBe(null);
      // Status should remain ERROR unless explicitly changed
    });
  });

  describe('setLastSyncAt', () => {
    it('should update last sync timestamp', () => {
      const timestamp = Date.now();
      const state = offlineReducer(initialState, setLastSyncAt(timestamp));

      expect(state.lastSyncAt).toBe(timestamp);
    });

    it('should clear last sync timestamp when set to null', () => {
      const timestampState = { ...initialState, lastSyncAt: Date.now() };
      const state = offlineReducer(timestampState, setLastSyncAt(null));

      expect(state.lastSyncAt).toBe(null);
    });
  });

  describe('Action serialization', () => {
    it('should preserve all SyncAction properties', () => {
      const action: SyncAction = {
        id: 'sync-1',
        type: 'ADD_STOP',
        payload: { tripId: 'trip-1', waypoint: { id: 'wp-1', location: { type: 'Point', coordinates: [0, 0] } } },
        timestamp: 1234567890,
        retryCount: 2,
      };

      const state = offlineReducer(initialState, addToQueue(action));

      expect(state.queue[0]).toEqual(action);
      expect(state.queue[0].id).toBe('sync-1');
      expect(state.queue[0].type).toBe('ADD_STOP');
      expect(state.queue[0].retryCount).toBe(2);
    });
  });
});
