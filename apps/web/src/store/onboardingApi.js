// Onboarding RTK Query API endpoints for Firestore persistence and AI refinement
import { api } from './api';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Get onboarding preferences from Firestore (if already saved)
export const onboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Save preferences to Firestore
    savePreferences: builder.mutation({
      queryFn: async ({ userId, travelPreferences, privacyConsent }) => {
        if (!userId) {
          return { error: { status: 401, data: 'User ID required' } };
        }

        try {
          const userDocRef = doc(db, 'users', userId);
          
          // Check if document exists
          const userDoc = await getDoc(userDocRef);
          
          const updates = {
            travelPreferences,
            privacyConsent,
            updatedAt: new Date(),
          };

          // Add audit log entry for onboarding completion
          if (userDoc.exists()) {
            const existingData = userDoc.data();
            const auditLog = existingData.auditLog || [];
            auditLog.push({
              action: 'onboarding_completed',
              timestamp: new Date(),
              metadata: {
                hasPreferences: !!travelPreferences,
                consentGiven: privacyConsent,
              },
            });
            updates.auditLog = auditLog;
          }

          // Update or create document
          await updateDoc(userDocRef, updates);

          // Fetch updated document
          const updatedDoc = await getDoc(userDocRef);
          return {
            data: {
              id: updatedDoc.id,
              ...updatedDoc.data(),
            },
          };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: error.message || 'Failed to save preferences',
            },
          };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Profile', id: userId },
      ],
    }),

    // Call AI refinement function
    refinePreferencesWithAI: builder.mutation({
      queryFn: async ({ preferences, aiRefinementText, idToken }) => {
        const endpoint = import.meta.env.VITE_AI_REFINEMENT_ENDPOINT;
        const enabled = import.meta.env.VITE_AI_REFINEMENT_ENABLED !== 'false';

        if (!enabled || !endpoint) {
          return {
            error: {
              status: 503,
              data: 'AI refinement is not available',
            },
          };
        }

        if (!idToken) {
          return {
            error: {
              status: 401,
              data: 'Authentication required',
            },
          };
        }

        try {
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              preferences,
              aiRefinementText: aiRefinementText || '',
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            
            // Handle rate limiting
            if (response.status === 429) {
              return {
                error: {
                  status: 429,
                  data: 'Rate limit exceeded. Please try again later.',
                },
              };
            }

            // Handle auth errors
            if (response.status === 401 || response.status === 403) {
              return {
                error: {
                  status: response.status,
                  data: 'Authentication failed. Please sign in again.',
                },
              };
            }

            return {
              error: {
                status: response.status,
                data: errorText || 'AI refinement failed',
              },
            };
          }

          const data = await response.json();

          // Expected response shape: { suggestedPreferences: {...} }
          // If backend returns different shape, adjust here
          return {
            data: data.suggestedPreferences || data,
          };
        } catch (error) {
          // Handle abort (timeout)
          if (error.name === 'AbortError') {
            return {
              error: {
                status: 408,
                data: 'Request timeout. Please try again.',
              },
            };
          }

          // Handle network errors
          if (error.message?.includes('fetch')) {
            return {
              error: {
                status: 503,
                data: 'Network error. Please check your connection.',
              },
            };
          }

          return {
            error: {
              status: 500,
              data: error.message || 'AI refinement failed',
            },
          };
        }
      },
      // Retry once with exponential backoff (handled by RTK Query)
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Error already handled in queryFn
        }
      },
    }),
  }),
});

export const {
  useSavePreferencesMutation,
  useRefinePreferencesWithAIMutation,
} = onboardingApi;