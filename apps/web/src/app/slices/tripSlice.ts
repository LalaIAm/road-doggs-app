// Trip slice - manages trip state and operations
// Based on TRD-69-77: TripMetadata interface

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TripMetadata, TripStatus } from '@roaddoggs/core/models/trip';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../infrastructure/api/firebase';

interface TripState {
  trips: TripMetadata[];
  currentTrip: TripMetadata | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
};

// Async thunks for Firestore operations

/**
 * Fetch all trips for the current user
 */
export const fetchTrips = createAsyncThunk(
  'trip/fetchTrips',
  async (userId: string, { rejectWithValue }) => {
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('ownerId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const trips: TripMetadata[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        trips.push({
          id: docSnap.id,
          ...data,
        } as TripMetadata);
      });
      
      return trips;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trips');
    }
  }
);

/**
 * Fetch a single trip by ID
 */
export const fetchTripById = createAsyncThunk(
  'trip/fetchTripById',
  async (tripId: string, { rejectWithValue }) => {
    try {
      const tripRef = doc(db, 'trips', tripId);
      const tripSnap = await getDoc(tripRef);
      
      if (!tripSnap.exists()) {
        return rejectWithValue('Trip not found');
      }
      
      return {
        id: tripSnap.id,
        ...tripSnap.data(),
      } as TripMetadata;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch trip');
    }
  }
);

/**
 * Create a new trip
 * Note: This will be enhanced with sync support in Sync Manager
 */
export const createTrip = createAsyncThunk(
  'trip/createTrip',
  async (tripData: Omit<TripMetadata, 'id'>, { rejectWithValue }) => {
    try {
      const tripsRef = collection(db, 'trips');
      const docRef = await addDoc(tripsRef, {
        ...tripData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return {
        id: docRef.id,
        ...tripData,
      } as TripMetadata;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create trip');
    }
  }
);

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    /**
     * Set trips list
     */
    setTrips: (state, action: PayloadAction<TripMetadata[]>) => {
      state.trips = action.payload;
      state.error = null;
    },

    /**
     * Set current/active trip
     */
    setCurrentTrip: (state, action: PayloadAction<TripMetadata | null>) => {
      state.currentTrip = action.payload;
    },

    /**
     * Update trip (optimistic update)
     * Used for optimistic UI updates before sync
     */
    updateTrip: (state, action: PayloadAction<Partial<TripMetadata> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in trips array
      const tripIndex = state.trips.findIndex(t => t.id === id);
      if (tripIndex !== -1) {
        state.trips[tripIndex] = { ...state.trips[tripIndex], ...updates };
      }
      
      // Update current trip if it matches
      if (state.currentTrip?.id === id) {
        state.currentTrip = { ...state.currentTrip, ...updates };
      }
    },

    /**
     * Add trip to list
     */
    addTrip: (state, action: PayloadAction<TripMetadata>) => {
      state.trips.push(action.payload);
    },

    /**
     * Remove trip from list
     */
    removeTrip: (state, action: PayloadAction<string>) => {
      state.trips = state.trips.filter(t => t.id !== action.payload);
      if (state.currentTrip?.id === action.payload) {
        state.currentTrip = null;
      }
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
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchTrips
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.trips = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchTripById
    builder
      .addCase(fetchTripById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.currentTrip = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createTrip
    builder
      .addCase(createTrip.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.trips.push(action.payload);
        state.currentTrip = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setTrips,
  setCurrentTrip,
  updateTrip,
  addTrip,
  removeTrip,
  setLoading,
  setError,
  clearError,
} = tripSlice.actions;

export default tripSlice.reducer;
