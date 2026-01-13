// Redux store configuration
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import onboardingReducer from "./onboardingSlice";
import { api } from "./api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    onboarding: onboardingReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
