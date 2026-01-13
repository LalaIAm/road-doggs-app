// RTK Query base API configuration with Firebase ID token injection
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { auth } from "../config/firebase";

// Base query with token injection
const baseQuery = fetchBaseQuery({
  baseUrl: "/api", // Backend API base URL
  prepareHeaders: async (headers) => {
    // Get Firebase ID token from auth state
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        headers.set("authorization", `Bearer ${token}`);
      }
    } catch (error) {
      // Token retrieval failed, continue without token
      console.error("Failed to get ID token:", error);
    }
    return headers;
  },
});

// Base query with error handling
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 unauthorized errors
  if (result.error && result.error.status === 401) {
    // Token might be expired, try to refresh
    try {
      const user = auth.currentUser;
      if (user) {
        await user.getIdToken(true); // Force refresh
        result = await baseQuery(args, api, extraOptions);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
  }

  return result;
};

// Create base API
export const api = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile", "User"],
  endpoints: () => ({}),
});
