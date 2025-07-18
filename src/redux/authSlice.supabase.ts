import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getCurrentUser, signIn, signOut, signUpWithTrigger } from '../services/supabase';
import { AuthState } from '../types';

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
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

      console.log('✅ Signup successful with database trigger for profile creation');
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role,
          full_name: fullName,
        },
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
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Get user profile information
      const userProfile = await getCurrentUser();
      
      return {
        user: userProfile ? {
          id: userProfile.id,
          email: userProfile.email || '',
          role: userProfile.role || 'consumer',
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          location: userProfile.location,
        } : null,
        session: data.session,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const signOutUser = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
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
      const userProfile = await getCurrentUser();
      return userProfile ? {
        id: userProfile.id,
        email: userProfile.email || '',
        role: userProfile.role || 'consumer',
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        location: userProfile.location,
      } : null;
    } catch (error: any) {
      return rejectWithValue(error.message);
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
    setSession: (state, action: PayloadAction<any>) => {
      state.session = action.payload;
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
        state.user = action.payload.user;
        state.session = action.payload.session;
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
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSession } = authSlice.actions;
export default authSlice.reducer;
