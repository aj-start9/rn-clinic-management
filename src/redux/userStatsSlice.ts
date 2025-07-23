import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserStats, UserStatsService } from '../services/userStatsService';
import { resetAllState } from './authSlice.supabase';

interface UserStatsState {
  stats: UserStats | null;
  recentAppointments: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: UserStatsState = {
  stats: null,
  recentAppointments: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk to fetch user statistics
export const fetchUserStats = createAsyncThunk(
  'userStats/fetchUserStats',
  async ({ userId, userRole }: { userId: string; userRole: 'consumer' | 'doctor' }, { rejectWithValue }) => {
    try {
      const stats = await UserStatsService.getUserStats(userId, userRole);
      const recentAppointments = await UserStatsService.getRecentAppointments(userId, userRole, 5);
      
      return {
        stats,
        recentAppointments,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user statistics');
    }
  }
);

// Async thunk to refresh user statistics
export const refreshUserStats = createAsyncThunk(
  'userStats/refreshUserStats',
  async ({ userId, userRole }: { userId: string; userRole: 'consumer' | 'doctor' }, { rejectWithValue }) => {
    try {
      const stats = await UserStatsService.refreshUserStats(userId, userRole);
      console.log('User stats refreshed:', stats);
      const recentAppointments = await UserStatsService.getRecentAppointments(userId, userRole, 5);
      
      return {
        stats,
        recentAppointments,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh user statistics');
    }
  }
);

const userStatsSlice = createSlice({
  name: 'userStats',
  initialState,
  reducers: {
    clearUserStats: (state) => {
      state.stats = null;
      state.recentAppointments = [];
      state.error = null;
      state.lastUpdated = null;
    },
    clearUserStatsError: (state) => {
      state.error = null;
    },
    updateLocalStats: (state, action: PayloadAction<Partial<UserStats>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.recentAppointments = action.payload.recentAppointments;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Refresh user stats
      .addCase(refreshUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.recentAppointments = action.payload.recentAppointments;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(refreshUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset all state on logout
      .addCase(resetAllState, (state) => {
        return initialState;
      });
  },
});

export const { 
  clearUserStats, 
  clearUserStatsError, 
  updateLocalStats 
} = userStatsSlice.actions;

export default userStatsSlice.reducer;
