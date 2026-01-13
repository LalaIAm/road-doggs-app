// Profile RTK Query API endpoints
import { api } from './api';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Get user profile from Firestore
export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get profile
    getProfile: builder.query({
      queryFn: async (userId) => {
        if (!userId) {
          return { error: { status: 400, data: 'User ID required' } };
        }
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            return { data: null }; // Return null if profile doesn't exist yet
          }
          
          return { data: { id: userDoc.id, ...userDoc.data() } };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: (result, error, userId) => [{ type: 'Profile', id: userId }],
    }),

    // Update profile
    updateProfile: builder.mutation({
      queryFn: async ({ userId, updates }) => {
        try {
          const userDocRef = doc(db, 'users', userId);
          
          // TODO: If backend encryption API available, encrypt sensitive fields here
          // For now, direct Firestore write (non-sensitive fields only)
          // Sensitive fields (email, travelPreferences) should be gated until encryption API available
          
          await updateDoc(userDocRef, {
            ...updates,
            updatedAt: new Date(),
          });
          
          // Fetch updated document
          const updatedDoc = await getDoc(userDocRef);
          return { data: { id: updatedDoc.id, ...updatedDoc.data() } };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [{ type: 'Profile', id: userId }],
    }),

    // Upload profile photo
    uploadProfilePhoto: builder.mutation({
      queryFn: async ({ userId, file }) => {
        try {
          // TODO: If backend signed URL endpoint available, use that instead
          // For now, use Firebase Storage directly with authenticated upload
          
          // Generate file path: profile-photos/{userId}/{timestamp}-{filename}
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name}`;
          const filePath = `profile-photos/${userId}/${fileName}`;
          
          // Upload to Firebase Storage
          const storageRef = ref(storage, filePath);
          await uploadBytes(storageRef, file);
          
          // Get download URL
          const downloadURL = await getDownloadURL(storageRef);
          
          // Update profile with photo URL
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            profilePhotoUrl: downloadURL,
            updatedAt: new Date(),
          });
          
          return { data: { profilePhotoUrl: downloadURL } };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [{ type: 'Profile', id: userId }],
    }),

    // Request signed upload URL (when backend available)
    getSignedUploadUrl: builder.mutation({
      queryFn: async ({ fileName, contentType }) => {
        try {
          // TODO: Call backend API: POST /api/upload/signed-url
          // For now, return error indicating backend not available
          return {
            error: {
              status: 501,
              data: 'Signed URL endpoint not yet available. Using direct Firebase Storage upload.',
            },
          };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),

    // Update privacy consent
    updatePrivacyConsent: builder.mutation({
      queryFn: async ({ userId, privacyConsent }) => {
        try {
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            privacyConsent,
            updatedAt: new Date(),
          });
          
          const updatedDoc = await getDoc(userDocRef);
          return { data: { id: updatedDoc.id, ...updatedDoc.data() } };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [{ type: 'Profile', id: userId }],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
  useGetSignedUploadUrlMutation,
  useUpdatePrivacyConsentMutation,
} = profileApi;
