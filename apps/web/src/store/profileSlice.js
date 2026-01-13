// Profile state slice
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null, // User document from Firestore
  isLoading: false,
  error: null,
  uploadProgress: 0,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
      state.uploadProgress = 0;
    },
    updateProfileField: (state, action) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
});

export const {
  setProfile,
  setLoading,
  setError,
  setUploadProgress,
  clearProfile,
  updateProfileField,
} = profileSlice.actions;

export default profileSlice.reducer;
