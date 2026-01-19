// Waypoints slice - manages waypoints state using EntityAdapter
// Based on TRD-78-86: Waypoint interface, TRD-143-147: Fractional indexing

import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { Waypoint, WaypointType } from '@roaddoggs/core/models/trip';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../infrastructure/api/firebase';
// Import fractional indexing - using direct path since core package doesn't export it properly yet
// TODO: Update when core package exports are configured
import { generateIndexBetween } from '../../../../../packages/core/src/logic/fractionalIndexing';

// Create entity adapter for normalized waypoint state
// As per TRD-154: waypoints: EntityState<Waypoint>
const waypointsAdapter = createEntityAdapter<Waypoint>({
  selectId: (waypoint) => waypoint.id,
  sortComparer: (a, b) => a.orderIndex - b.orderIndex,
});

interface WaypointsState extends EntityState<Waypoint> {
  isLoading: boolean;
  error: string | null;
  currentTripId: string | null;
}

const initialState: WaypointsState = waypointsAdapter.getInitialState({
  isLoading: false,
  error: null,
  currentTripId: null,
});

// Async thunks for Firestore operations

/**
 * Fetch waypoints for a trip
 * As per TRD-31: Waypoints stored as sub-collection documents
 */
export const fetchWaypoints = createAsyncThunk(
  'waypoints/fetchWaypoints',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const waypointsRef = collection(db, 'trips', tripId, 'waypoints');
      const q = query(waypointsRef, orderBy('orderIndex', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const waypoints: Waypoint[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        waypoints.push({
          id: docSnap.id,
          ...data,
        } as Waypoint);
      });
      
      return { tripId, waypoints };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch waypoints');
    }
  }
);

/**
 * Add a stop/waypoint
 * Note: This will be enhanced with sync support in Sync Manager
 */
export const addStop = createAsyncThunk(
  'waypoints/addStop',
  async (
    { tripId, waypoint }: { tripId: string; waypoint: Omit<Waypoint, 'id'> },
    { getState, rejectWithValue }
  ) => {
    try {
      // Get current waypoints to calculate orderIndex using fractional indexing
      const state = getState() as any;
      const currentWaypoints = Object.values(state.waypoints.entities) as Waypoint[];
      const tripWaypoints = currentWaypoints
        .filter(w => w.tripId === tripId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Calculate new orderIndex
      let orderIndex: number;
      if (tripWaypoints.length === 0) {
        orderIndex = 0; // First waypoint
      } else {
        // Insert at end - use fractional indexing
        const lastIndex = tripWaypoints[tripWaypoints.length - 1].orderIndex;
        orderIndex = generateIndexBetween(lastIndex, null);
      }
      
      const waypointsRef = collection(db, 'trips', tripId, 'waypoints');
      const docRef = await addDoc(waypointsRef, {
        ...waypoint,
        orderIndex,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...waypoint,
        orderIndex,
      } as Waypoint;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add stop');
    }
  }
);

/**
 * Update a waypoint
 */
export const updateStop = createAsyncThunk(
  'waypoints/updateStop',
  async (
    { tripId, waypointId, updates }: { tripId: string; waypointId: string; updates: Partial<Waypoint> },
    { rejectWithValue }
  ) => {
    try {
      const waypointRef = doc(db, 'trips', tripId, 'waypoints', waypointId);
      await updateDoc(waypointRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      return { id: waypointId, ...updates };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update stop');
    }
  }
);

/**
 * Delete a waypoint
 */
export const deleteStop = createAsyncThunk(
  'waypoints/deleteStop',
  async (
    { tripId, waypointId }: { tripId: string; waypointId: string },
    { rejectWithValue }
  ) => {
    try {
      const waypointRef = doc(db, 'trips', tripId, 'waypoints', waypointId);
      await deleteDoc(waypointRef);
      
      return waypointId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete stop');
    }
  }
);

const waypointsSlice = createSlice({
  name: 'waypoints',
  initialState,
  reducers: {
    /**
     * Add waypoint (optimistic update)
     */
    addWaypoint: (state, action: PayloadAction<Waypoint>) => {
      waypointsAdapter.addOne(state, action.payload);
    },

    /**
     * Update waypoint (optimistic update)
     */
    updateWaypoint: (state, action: PayloadAction<Partial<Waypoint> & { id: string }>) => {
      waypointsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
    },

    /**
     * Remove waypoint (optimistic update)
     */
    removeWaypoint: (state, action: PayloadAction<string>) => {
      waypointsAdapter.removeOne(state, action.payload);
    },

    /**
     * Set all waypoints (from Firestore)
     */
    setWaypoints: (state, action: PayloadAction<Waypoint[]>) => {
      waypointsAdapter.setAll(state, action.payload);
    },

    /**
     * Reorder waypoints using fractional indexing
     * As per TRD-143-147: Fractional indexing for ordering
     */
    reorderWaypoints: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number; tripId: string }>
    ) => {
      const { fromIndex, toIndex, tripId } = action.payload;
      
      // Get waypoints for this trip, sorted by orderIndex
      const tripWaypoints = Object.values(state.entities)
        .filter(w => w && w.tripId === tripId)
        .sort((a, b) => a.orderIndex - b.orderIndex) as Waypoint[];
      
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
          fromIndex >= tripWaypoints.length || toIndex >= tripWaypoints.length) {
        return;
      }
      
      // Calculate new orderIndex using fractional indexing
      const movedWaypoint = tripWaypoints[fromIndex];
      let newOrderIndex: number;
      
      if (toIndex === 0) {
        // Moving to start
        newOrderIndex = generateIndexBetween(null, tripWaypoints[0].orderIndex);
      } else if (toIndex === tripWaypoints.length - 1) {
        // Moving to end
        newOrderIndex = generateIndexBetween(
          tripWaypoints[tripWaypoints.length - 1].orderIndex,
          null
        );
      } else {
        // Moving between two waypoints
        const prevIndex = toIndex < fromIndex ? toIndex - 1 : toIndex;
        const nextIndex = toIndex < fromIndex ? toIndex : toIndex + 1;
        newOrderIndex = generateIndexBetween(
          tripWaypoints[prevIndex].orderIndex,
          tripWaypoints[nextIndex].orderIndex
        );
      }
      
      // Update the waypoint's orderIndex
      waypointsAdapter.updateOne(state, {
        id: movedWaypoint.id,
        changes: { orderIndex: newOrderIndex },
      });
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Set current trip ID
     */
    setCurrentTripId: (state, action: PayloadAction<string | null>) => {
      state.currentTripId = action.payload;
    },

    /**
     * Clear all waypoints
     */
    clearWaypoints: (state) => {
      waypointsAdapter.removeAll(state);
      state.currentTripId = null;
    },
  },
  extraReducers: (builder) => {
    // fetchWaypoints
    builder
      .addCase(fetchWaypoints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWaypoints.fulfilled, (state, action) => {
        waypointsAdapter.setAll(state, action.payload.waypoints);
        state.currentTripId = action.payload.tripId;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchWaypoints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // addStop
    builder
      .addCase(addStop.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addStop.fulfilled, (state, action) => {
        waypointsAdapter.addOne(state, action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addStop.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // updateStop
    builder
      .addCase(updateStop.fulfilled, (state, action) => {
        waypointsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload,
        });
      });

    // deleteStop
    builder
      .addCase(deleteStop.fulfilled, (state, action) => {
        waypointsAdapter.removeOne(state, action.payload);
      });
  },
});

// Export selectors
export const {
  selectAll: selectAllWaypoints,
  selectById: selectWaypointById,
  selectIds: selectWaypointIds,
  selectEntities: selectWaypointEntities,
} = waypointsAdapter.getSelectors((state: any) => state.waypoints);

export const {
  addWaypoint,
  updateWaypoint,
  removeWaypoint,
  setWaypoints,
  reorderWaypoints,
  setLoading,
  setError,
  setCurrentTripId,
  clearWaypoints,
} = waypointsSlice.actions;

export default waypointsSlice.reducer;
