import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDoctorById, getDoctors } from '../services/doctorService';
import { DoctorState } from '../types';
import { resetAllState } from './authSlice.supabase';

const initialState: DoctorState = {
  doctors: [],
  selectedDoctor: null,
  loading: false,
  error: null,
  searchQuery: '',
  filters: {
    specialty_id: '',
    rating: 0,
    experience: 0,
  },
};

// Async thunks for Supabase
export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await getDoctors();
      if (error) { 
        throw new Error(error.message);
      }
      
      return data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDoctorById = createAsyncThunk(
  'doctors/fetchDoctorById',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await getDoctorById(doctorId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// New thunk for fetching detailed doctor information
export const fetchDoctorDetails = createAsyncThunk(
  'doctors/fetchDoctorDetails',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const { getDoctorDetails } = await import('../services/doctorService');
      const { data, error } = await getDoctorDetails(doctorId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        specialty_id: '',
        rating: 0,
        experience: 0,
      };
    },
    setSelectedSpecialty: (state, action) => {
      state.filters.specialty_id = action.payload;
    },
    clearSelectedDoctor: (state) => {
      state.selectedDoctor = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
        state.error = null;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Doctor by ID
      .addCase(fetchDoctorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDoctor = action.payload;
        state.error = null;
      })
      .addCase(fetchDoctorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Doctor Details (new detailed API)
      .addCase(fetchDoctorDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorDetails.fulfilled, (state, action) => {
        state.loading = false;
        // @ts-ignore
        state.selectedDoctor = action.payload;
        state.error = null;
      })
      .addCase(fetchDoctorDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset all state on logout
      .addCase(resetAllState, (state) => {
        return initialState;
      });
  },
});

export const { setSearchQuery, setFilters, clearFilters, setSelectedSpecialty, clearSelectedDoctor, clearError } = doctorSlice.actions;
export default doctorSlice.reducer;
