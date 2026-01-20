// Unit tests for SyncManager
// Tests TRD-163-176: Sync Manager logic and state machine

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { SyncManager } from './SyncManager';
import { SyncAction } from './types';
import offlineReducer from '../slices/offlineSlice';
import tripReducer from '../slices/tripSlice';
import waypointsReducer from '../slices/waypointsSlice';
import uiReducer from '../slices/uiSlice';
import { api } from '../../store/api';

// Mock firestoreOperations before imports
const mockExecuteSyncAction = vi.fn();
const mockIsTerminalError = vi.fn((error: any) => {
  return error?.code === 'permission-denied' || error?.code === 'not-found';
});

vi.mock('./firestoreOperations', () => ({
  executeSyncAction: mockExecuteSyncAction,
  isTerminalError: mockIsTerminalError,
}));

describe('SyncManager', () => {
  let store: ReturnType<typeof configureStore>;
  let syncManager: SyncManager;

  beforeEach(() => {
    // Reset mocks
    mockExecuteSyncAction.mockClear();
    mockIsTerminalError.mockClear();

    // Create a test store
    store = configureStore({
      reducer: {
        offline: offlineReducer,
        trip: tripReducer,
        waypoints: waypointsReducer,
        ui: uiReducer,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });

    // Mock window events
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: { onLine: true },
    });

    // Create SyncManager
    syncManager = new SyncManager(store);
  });

  afterEach(() => {
    if (syncManager) {
      syncManager.destroy();
    }
    vi.clearAllMocks();
  });

  const createSyncAction = (id: string, type: string = 'UPDATE_TRIP'): SyncAction => ({
    id,
    type: type as any,
    payload: { tripId: 'trip-1', updates: { title: 'Test Trip' } },
    timestamp: Date.now(),
    retryCount: 0,
  });

  describe('Initialization', () => {
    it('should initialize with current network status', () => {
      const state = store.getState();
      expect(state.offline.networkStatus).toBe(true);
    });

    it('should process queue if items exist on initialization', async () => {
      const action = createSyncAction('sync-1');
      store.dispatch({ type: 'offline/addToQueue', payload: action });

      // Create new manager - should process queue
      const newManager = new SyncManager(store);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockExecuteSyncAction).toHaveBeenCalled();
      newManager.destroy();
    });
  });

  describe('Network Status Listeners', () => {
    it('should dispatch networkStatusChanged(false) on window.offline event', () => {
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      const state = store.getState();
      expect(state.offline.networkStatus).toBe(false);
    });

    it('should dispatch networkStatusChanged(true) and trigger queue processing on window.online event', async () => {
      // Set offline first
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      // Add action to queue
      const action = createSyncAction('sync-1');
      store.dispatch({ type: 'offline/addToQueue', payload: action });

      // Go online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const state = store.getState();
      expect(state.offline.networkStatus).toBe(true);
      expect(mockExecuteSyncAction).toHaveBeenCalled();
    });
  });

  describe('addToSyncQueue', () => {
    it('should add action to queue via dispatch', () => {
      const action = createSyncAction('sync-1');
      syncManager.addToSyncQueue(action);

      const state = store.getState();
      expect(state.offline.queue).toHaveLength(1);
      expect(state.offline.queue[0].id).toBe('sync-1');
    });
  });

  describe('processMutationQueue', () => {
    it('should process queue items sequentially when online', async () => {
      const action1 = createSyncAction('sync-1');
      const action2 = createSyncAction('sync-2');
      const action3 = createSyncAction('sync-3');

      mockExecuteSyncAction.mockResolvedValue(undefined);

      syncManager.addToSyncQueue(action1);
      syncManager.addToSyncQueue(action2);
      syncManager.addToSyncQueue(action3);

      await syncManager.processMutationQueue();

      expect(mockExecuteSyncAction).toHaveBeenCalledTimes(3);
      expect(mockExecuteSyncAction).toHaveBeenNthCalledWith(1, action1);
      expect(mockExecuteSyncAction).toHaveBeenNthCalledWith(2, action2);
      expect(mockExecuteSyncAction).toHaveBeenNthCalledWith(3, action3);

      const state = store.getState();
      expect(state.offline.queue).toHaveLength(0);
      expect(state.offline.status).toBe('IDLE');
    });

    it('should not process queue when offline', async () => {
      // Set offline
      store.dispatch({ type: 'offline/networkStatusChanged', payload: false });

      const action = createSyncAction('sync-1');
      syncManager.addToSyncQueue(action);

      await syncManager.processMutationQueue();

      expect(mockExecuteSyncAction).not.toHaveBeenCalled();

      const state = store.getState();
      expect(state.offline.queue).toHaveLength(1);
    });

    it('should not process queue when already processing', async () => {
      const action = createSyncAction('sync-1');
      mockExecuteSyncAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      syncManager.addToSyncQueue(action);

      // Start processing
      const promise1 = syncManager.processMutationQueue();
      // Try to process again (should be ignored)
      const promise2 = syncManager.processMutationQueue();

      await Promise.all([promise1, promise2]);

      // Should only be called once
      expect(mockExecuteSyncAction).toHaveBeenCalledTimes(1);
    });

    it('should remove action from queue on successful sync', async () => {
      const action = createSyncAction('sync-1');
      mockExecuteSyncAction.mockResolvedValue(undefined);

      syncManager.addToSyncQueue(action);
      await syncManager.processMutationQueue();

      const state = store.getState();
      expect(state.offline.queue).toHaveLength(0);
      expect(state.offline.lastSyncAt).not.toBe(null);
    });

    it('should handle terminal errors and clear queue', async () => {
      const action = createSyncAction('sync-1');
      const terminalError = { code: 'permission-denied', message: 'Access denied' };
      
      mockExecuteSyncAction.mockRejectedValue(terminalError);
      mockIsTerminalError.mockReturnValue(true);

      syncManager.addToSyncQueue(action);
      await syncManager.processMutationQueue();

      const state = store.getState();
      expect(state.offline.queue).toHaveLength(0);
      expect(state.offline.status).toBe('ERROR');
      expect(state.offline.error).toBeTruthy();
    });

    it('should retry on non-terminal errors with exponential backoff', async () => {
      vi.useFakeTimers();
      
      const action = createSyncAction('sync-1');
      const nonTerminalError = { code: 'unavailable', message: 'Service unavailable' };
      
      mockExecuteSyncAction
        .mockRejectedValueOnce(nonTerminalError)
        .mockResolvedValueOnce(undefined);
      mockIsTerminalError.mockReturnValue(false);

      syncManager.addToSyncQueue(action);
      
      // Start processing
      const processPromise = syncManager.processMutationQueue();
      
      // Fast-forward time to trigger retry
      vi.advanceTimersByTime(2000);
      await processPromise;

      const state = store.getState();
      expect(mockExecuteSyncAction).toHaveBeenCalledTimes(2);
      expect(state.offline.queue[0]?.retryCount).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should update status to SYNCING during processing', async () => {
      const action = createSyncAction('sync-1');
      mockExecuteSyncAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50)));

      syncManager.addToSyncQueue(action);
      const processPromise = syncManager.processMutationQueue();

      // Check status during processing
      await new Promise(resolve => setTimeout(resolve, 10));
      let state = store.getState();
      expect(state.offline.status).toBe('SYNCING');

      await processPromise;
      state = store.getState();
      expect(state.offline.status).toBe('IDLE');
    });
  });

  describe('State Machine Transitions', () => {
    it('should transition IDLE -> PENDING_WRITES -> SYNCING -> IDLE on successful sync', async () => {
      const action = createSyncAction('sync-1');
      mockExecuteSyncAction.mockResolvedValue(undefined);

      let state = store.getState();
      expect(state.offline.status).toBe('IDLE');

      syncManager.addToSyncQueue(action);
      state = store.getState();
      expect(state.offline.status).toBe('PENDING_WRITES');

      await syncManager.processMutationQueue();
      state = store.getState();
      expect(state.offline.status).toBe('IDLE');
    });

    it('should transition IDLE -> OFFLINE when network goes offline', () => {
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      const state = store.getState();
      expect(state.offline.status).toBe('OFFLINE');
    });

    it('should transition OFFLINE -> PENDING_WRITES when action queued offline', () => {
      // Set offline
      store.dispatch({ type: 'offline/networkStatusChanged', payload: false });

      const action = createSyncAction('sync-1');
      syncManager.addToSyncQueue(action);

      const state = store.getState();
      expect(state.offline.status).toBe('PENDING_WRITES');
    });
  });

  describe('Queue Processing Order', () => {
    it('should process queue items in FIFO order', async () => {
      const action1 = createSyncAction('sync-1', 'UPDATE_TRIP');
      const action2 = createSyncAction('sync-2', 'ADD_STOP');
      const action3 = createSyncAction('sync-3', 'DELETE_STOP');

      const callOrder: string[] = [];
      mockExecuteSyncAction.mockImplementation(async (action: SyncAction) => {
        callOrder.push(action.id);
      });

      syncManager.addToSyncQueue(action1);
      syncManager.addToSyncQueue(action2);
      syncManager.addToSyncQueue(action3);

      await syncManager.processMutationQueue();

      expect(callOrder).toEqual(['sync-1', 'sync-2', 'sync-3']);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      syncManager.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    });
  });
});
