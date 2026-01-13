// Auth state slice with Firebase authentication thunks
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  onIdTokenChanged,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  linkWithPopup,
  unlink,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const initialState = {
  currentUser: null, // Firebase User object
  idToken: null, // Firebase ID token string
  providersLinked: [], // Array of provider IDs (e.g., ['google.com', 'password'])
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Initialize auth state listener
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { dispatch }) => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Get ID token
          const token = await user.getIdToken();
          const providers = user.providerData.map(
            (provider) => provider.providerId
          );

          dispatch(setCurrentUser(user));
          dispatch(setIdToken(token));
          dispatch(setProvidersLinked(providers));

          // Create/update user document in Firestore
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                name: user.displayName || "",
                email: user.email || "",
                profilePhotoUrl: user.photoURL || "",
                createdAt: new Date(),
                updatedAt: new Date(),
                linkedSocialAccounts: providers.map((pid) => ({
                  providerId: pid,
                  uid: user.uid,
                  email: user.email,
                })),
                auditLog: [],
              });
            }
          } catch (error) {
            console.error("Error creating user document:", error);
          }
        } else {
          dispatch(clearAuth());
        }
        dispatch(setInitialized(true));
        resolve(user);
      });

      // Listen for token changes
      onIdTokenChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken();
          dispatch(setIdToken(token));
        }
      });
    });
  }
);

// Sign up with email/password
export const signUpWithEmail = createAsyncThunk(
  "auth/signUpWithEmail",
  async ({ email, password, firstName, lastName }, { rejectWithValue }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile with name
      if (firstName || lastName) {
        await user.updateProfile({
          displayName: `${firstName} ${lastName}`.trim(),
        });
      }

      // Get token
      const token = await user.getIdToken();
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Sign in with email/password
export const signInWithEmail = createAsyncThunk(
  "auth/signInWithEmail",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Sign in with Google
export const signInWithGoogle = createAsyncThunk(
  "auth/signInWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const token = await user.getIdToken();
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Sign in with Apple
export const signInWithApple = createAsyncThunk(
  "auth/signInWithApple",
  async (_, { rejectWithValue }) => {
    try {
      const provider = new OAuthProvider("apple.com");
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const token = await user.getIdToken();
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Sign in with Facebook
export const signInWithFacebook = createAsyncThunk(
  "auth/signInWithFacebook",
  async (_, { rejectWithValue }) => {
    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const token = await user.getIdToken();
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Sign out
export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
      return null;
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Send password reset email
export const sendPasswordResetEmail = createAsyncThunk(
  "auth/sendPasswordResetEmail",
  async (email, { rejectWithValue }) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      return email;
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Refresh ID token
export const refreshIdToken = createAsyncThunk(
  "auth/refreshIdToken",
  async (_, { rejectWithValue }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }
      const token = await user.getIdToken(true); // Force refresh
      return token;
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Link provider to current user
export const linkProvider = createAsyncThunk(
  "auth/linkProvider",
  async ({ providerId }, { rejectWithValue, getState, dispatch }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }

      let provider;
      switch (providerId) {
        case "google.com":
          provider = new GoogleAuthProvider();
          break;
        case "apple.com":
          provider = new OAuthProvider("apple.com");
          break;
        case "facebook.com":
          provider = new FacebookAuthProvider();
          break;
        default:
          throw new Error("Unsupported provider");
      }

      const credential = await linkWithPopup(user, provider);

      // Log audit event
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const auditLog = userDoc.data()?.auditLog || [];
        auditLog.push({
          action: "provider_linked",
          providerId,
          timestamp: new Date(),
          metadata: { email: credential.user.email },
        });
        await setDoc(
          userDocRef,
          { auditLog, updatedAt: new Date() },
          { merge: true }
        );
      } catch (error) {
        console.error("Error logging audit event:", error);
      }

      // Update providers linked
      const providers = credential.user.providerData.map((p) => p.providerId);
      dispatch(setProvidersLinked(providers));

      return { user: credential.user, providers };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

// Unlink provider from current user
export const unlinkProvider = createAsyncThunk(
  "auth/unlinkProvider",
  async ({ providerId }, { rejectWithValue, getState, dispatch }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }

      // Ensure at least one provider remains
      const providers = user.providerData.map((p) => p.providerId);
      if (providers.length <= 1) {
        throw new Error("Cannot unlink the only provider");
      }

      await unlink(user, providerId);

      // Log audit event
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const auditLog = userDoc.data()?.auditLog || [];
        auditLog.push({
          action: "provider_unlinked",
          providerId,
          timestamp: new Date(),
        });
        await setDoc(
          userDocRef,
          { auditLog, updatedAt: new Date() },
          { merge: true }
        );
      } catch (error) {
        console.error("Error logging audit event:", error);
      }

      // Update providers linked
      const updatedProviders = user.providerData.map((p) => p.providerId);
      dispatch(setProvidersLinked(updatedProviders));

      return { providers: updatedProviders };
    } catch (error) {
      return rejectWithValue(error.code);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
      state.error = null;
    },
    setIdToken: (state, action) => {
      state.idToken = action.payload;
    },
    setProvidersLinked: (state, action) => {
      state.providersLinked = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    clearAuth: (state) => {
      state.currentUser = null;
      state.idToken = null;
      state.providersLinked = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder.addCase(initializeAuth.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(initializeAuth.fulfilled, (state) => {
      state.isLoading = false;
    });

    // Sign up
    builder.addCase(signUpWithEmail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signUpWithEmail.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.idToken = action.payload.token;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signUpWithEmail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Sign in with email
    builder.addCase(signInWithEmail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signInWithEmail.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.idToken = action.payload.token;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signInWithEmail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Sign in with Google
    builder.addCase(signInWithGoogle.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signInWithGoogle.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.idToken = action.payload.token;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signInWithGoogle.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Sign in with Apple
    builder.addCase(signInWithApple.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signInWithApple.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.idToken = action.payload.token;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signInWithApple.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Sign in with Facebook
    builder.addCase(signInWithFacebook.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signInWithFacebook.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.idToken = action.payload.token;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signInWithFacebook.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Sign out
    builder.addCase(signOut.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(signOut.fulfilled, (state) => {
      state.currentUser = null;
      state.idToken = null;
      state.providersLinked = [];
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(signOut.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Send password reset email
    builder.addCase(sendPasswordResetEmail.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendPasswordResetEmail.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(sendPasswordResetEmail.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Refresh token
    builder.addCase(refreshIdToken.fulfilled, (state, action) => {
      state.idToken = action.payload;
    });

    // Link provider
    builder.addCase(linkProvider.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(linkProvider.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.providersLinked = action.payload.providers;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(linkProvider.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Unlink provider
    builder.addCase(unlinkProvider.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(unlinkProvider.fulfilled, (state, action) => {
      state.providersLinked = action.payload.providers;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(unlinkProvider.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
  },
});

export const {
  setCurrentUser,
  setIdToken,
  setProvidersLinked,
  setLoading,
  setError,
  setInitialized,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
