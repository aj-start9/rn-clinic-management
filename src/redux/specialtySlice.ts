import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAvailableSpecialties, Specialty } from '../services/doctorOnboardingService';
import { resetAllState } from './authSlice.supabase';

interface SpecialtyState {
  specialties: Specialty[];
  loading: boolean;
  error: string | null;
  selectedSpecialtyId: string | null;
}

const initialState: SpecialtyState = {
  specialties: [],
  loading: false,
  error: null,
  selectedSpecialtyId: null,
};

// Async thunk to fetch specialties from Supabase
export const fetchSpecialties = createAsyncThunk(
  'specialties/fetchSpecialties',
  async (_, { rejectWithValue }) => {
    try {
      const specialties = await getAvailableSpecialties();
      return specialties;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch specialties');
    }
  }
);

const specialtySlice = createSlice({
  name: 'specialties',
  initialState,
  reducers: {
    setSelectedSpecialty: (state, action: PayloadAction<string>) => {
      state.selectedSpecialtyId = action.payload;
    },
    clearSelectedSpecialty: (state) => {
      state.selectedSpecialtyId = null;
    },
    clearSpecialtyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecialties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpecialties.fulfilled, (state, action) => {
        state.loading = false;
        state.specialties = action.payload;
        state.error = null;
      })
      .addCase(fetchSpecialties.rejected, (state, action) => {
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
  setSelectedSpecialty, 
  clearSelectedSpecialty, 
  clearSpecialtyError 
} = specialtySlice.actions;

export default specialtySlice.reducer;
