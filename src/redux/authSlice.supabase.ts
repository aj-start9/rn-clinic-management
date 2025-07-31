import { createAction, createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getCurrentUser, signIn, signOut, signUpWithTrigger } from '../services/supabase';
import { tokenService } from '../services/tokenService';
import { AuthState } from '../types';

// Root action to reset all state
export const resetAllState = createAction('app/resetAllState');

const initialState: AuthState = {
  user: null,
  session: null,
  doctorData: null, // Add doctor data to state
  loading: false,
  error: null,
  isDoctorOnboardingComplete: false,
  doctorOnboarded: false,
};

// Async thunks for Supabase
export const signUpUser = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, role, fullName }: { 
    email: string; 
    password: string; 
    role: 'consumer' | 'doctor'; 
    fullName: string;
  }, { rejectWithValue }) => {
    try {
      // Use the trigger-based signup function
      const { data, error } = await signUpWithTrigger(email, password, role, fullName);

      if (error) {
        throw new Error(error.message);
      }
      
      // Check if signup was successful
      if (!data.user) {
        throw new Error('Signup failed: No user returned');
      }

      const { generateAvatarRole, previewAvatarImage } = await import('../utils/avatarUtils');
      const tempUserId = Math.random().toString(36).substring(7); // Temporary ID for avatar generation
      const avatarRole = generateAvatarRole(role, tempUserId);
      const avatarUrl = previewAvatarImage(role, avatarRole);
      const userData = {
        id: data.user.id,
        email: data.user.email || '',
        role,
        full_name: fullName,
        avatar_url: avatarUrl || '',
      };

      // Store tokens and user data
      if (data.session?.access_token) {
        await tokenService.storeTokens(
          data.session.access_token,
          data.session.refresh_token
        );
        await tokenService.storeUserData(userData);
      }

      return {
        user: userData,
        session: data.session,
        profileCreated: 'automatic', // Profile created by database trigger
        profileError: null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const signInUser = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Starting signIn process...');
      const { data, error } = await signIn(email, password);
      console.log('SignIn response:', { 
        user: data?.user ? 'User found' : 'No user', 
        session: data?.session ? 'Session created' : 'No session',
        error: error?.message || 'No error' 
      });
      
      if (error) {
        console.error('SignIn error:', error);
        throw new Error(error.message);
      }      
      
      console.log('Fetching user profile...');
      const userProfile = await getCurrentUser();
      
      let doctorData = null;
      // If user is a doctor, fetch their doctor profile data
      if (userProfile?.role === 'doctor') {
        try {
          const { getCurrentDoctorProfile } = await import('../services/doctorService');
          doctorData = await getCurrentDoctorProfile(userProfile.id);
          console.log('Doctor profile data:', doctorData);
        } catch (doctorError) {
          console.log('No doctor profile found or error fetching:', doctorError);
          // This is expected for new doctors who haven't completed onboarding
        }
      }
      
      const userData = userProfile ? {
        id: userProfile.id,
        email: userProfile.email || '',
        role: userProfile.role || 'consumer',
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        location: userProfile.location,
      } : null;
      console.log('User data:', userData);
      // Store tokens and user data
      if (data.session?.access_token && userData) {
        console.log('Storing tokens and user data...');
        await tokenService.storeTokens(
          data.session.access_token,
          data.session.refresh_token
        );
        await tokenService.storeUserData(userData);
      }
      
      console.log('✅ SignIn completed successfully');
      
      // If user is a doctor, check onboarding status
      if (userData?.role === 'doctor') {
        console.log('Checking doctor onboarding status...');
        // We'll dispatch this separately in the component to avoid circular dependency
      }
      
      return {
        user: userData,
        session: data.session,
        doctorData: doctorData, // Include doctor data in return
      };
    } catch (error: any) {
      console.error('SignIn exception:', error);
      // Handle specific errors
      if (error.message && error.message.includes('STRUCTUREDCLONE')) {
        console.error('❌ structuredClone error detected - this may indicate a polyfill issue');
        return rejectWithValue('Authentication system error. Please try again.');
      }
      return rejectWithValue(error.message || 'An error occurred during sign in');
    }
  }
);

export const signOutUser = createAsyncThunk(
  'auth/signOut',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { error } = await signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear stored tokens and user data
      await tokenService.clearAll();
      
      // Reset all Redux state
      dispatch(resetAllState());
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      // First check if we have stored tokens
      const isLoggedIn = await tokenService.isLoggedIn();
      
      if (!isLoggedIn) {
        // No stored tokens, user needs to log in
        return null;
      }

      // Try to get current user from Supabase
      const userProfile = await getCurrentUser();
      
      if (userProfile) {
        let doctorData = null;
        // If user is a doctor, fetch their doctor profile data
        if (userProfile.role === 'doctor') {
          try {
            const { getCurrentDoctorProfile } = await import('../services/doctorService');
            doctorData = await getCurrentDoctorProfile(userProfile.id);
          } catch (doctorError) {
            console.log('No doctor profile found:', doctorError);
          }
        }
        
        // User is still valid in Supabase
        return {
          user: {
            id: userProfile.id,
            email: userProfile.email || '',
            role: userProfile.role || 'consumer',
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url,
            location: userProfile.location,
          },
          doctorData: doctorData,
        };
      } else {
        // User not found in Supabase, check stored user data
        const storedUserData = await tokenService.getUserData();
        
        if (storedUserData) {
          // Return stored user data as fallback
          return {
            user: storedUserData,
            doctorData: null, // Don't have stored doctor data, will fetch later if needed
          };
        }
        
        // Clear invalid tokens and return null
        await tokenService.clearAll();
        return null;
      }
    } catch (error: any) {
      // If there's an error (e.g., invalid token), clear stored data
      await tokenService.clearAll();
      return rejectWithValue(error.message);
    }
  }
);

// Check for existing session and auto-login
export const checkStoredAuth = createAsyncThunk(
  'auth/checkStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      // Check if user has stored tokens
      const isLoggedIn = await tokenService.isLoggedIn();
      
      if (!isLoggedIn) {
        return null;
      }

      // Get stored user data
      const storedUserData = await tokenService.getUserData();
      
      if (storedUserData) {
        // Try to validate with Supabase (optional - will fall back to stored data if network fails)
        try {
          const userProfile = await getCurrentUser();
          if (userProfile) {
            let doctorData = null;
            // If user is a doctor, fetch their doctor profile data
            if (userProfile.role === 'doctor') {
              try {
                const { getCurrentDoctorProfile } = await import('../services/doctorService');
                doctorData = await getCurrentDoctorProfile(userProfile.id);
              } catch (doctorError) {
                console.log('No doctor profile found:', doctorError);
              }
            }
            
            // Update stored data with latest from server
            const userData = {
              id: userProfile.id,
              email: userProfile.email || '',
              role: userProfile.role || 'consumer',
              full_name: userProfile.full_name,
              avatar_url: userProfile.avatar_url,
              location: userProfile.location,
            };
            await tokenService.storeUserData(userData);
            return {
              user: userData,
              doctorData: doctorData,
            };
          }
        } catch (networkError) {
          // Network error, use stored data
          console.log('Network error, using stored user data:', networkError);
        }
        
        // Return stored user data
        return {
          user: storedUserData,
          doctorData: null, // Don't have stored doctor data
        };
      }
      
      // No valid stored data
      await tokenService.clearAll();
      return null;
    } catch (error: any) {
      // Clear invalid data
      await tokenService.clearAll();
      return rejectWithValue(error.message);
    }
  }
);

// Check doctor onboarding status
export const checkDoctorOnboarding = createAsyncThunk(
  'auth/checkDoctorOnboarding',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { checkDoctorOnboardingStatus } = await import('../services/doctorOnboardingService');
      const status = await checkDoctorOnboardingStatus(userId);
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check doctor onboarding status');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDoctorOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.isDoctorOnboardingComplete = action.payload;
    },
    setDoctorOnboarded: (state, action: PayloadAction<boolean>) => {
      state.doctorOnboarded = action.payload;
      if (action.payload) {
        state.isDoctorOnboardingComplete = true;
      }
    },
    updateDoctorData: (state, action: PayloadAction<any>) => {
      state.doctorData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Sign In
      .addCase(signInUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.doctorData = action.payload.doctorData;
        state.error = null;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Sign Out
      .addCase(signOutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.doctorData = null;
        state.error = null;
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.doctorData = action.payload.doctorData;
        } else {
          state.user = null;
          state.doctorData = null;
        }
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Check Stored Auth
      .addCase(checkStoredAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.doctorData = action.payload.doctorData;
        } else {
          state.user = null;
          state.doctorData = null;
        }
        state.error = null;
      })
      .addCase(checkStoredAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Check Doctor Onboarding
      .addCase(checkDoctorOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkDoctorOnboarding.fulfilled, (state, action) => {
        state.loading = false;
        state.isDoctorOnboardingComplete = action.payload;
        state.doctorOnboarded = action.payload;
        state.error = null;
      })
      .addCase(checkDoctorOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset all state on logout
      .addCase(resetAllState, (state) => {
        return initialState;
      });
  },
});

export const { clearError, setDoctorOnboardingComplete, setDoctorOnboarded, updateDoctorData } = authSlice.actions;
export default authSlice.reducer;
