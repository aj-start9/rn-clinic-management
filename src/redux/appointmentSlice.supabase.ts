import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDoctorAppointments } from '../services/doctorService';
import { createAppointment, getAppointmentsByRole, getUserAppointments } from '../services/supabase';
import { AppointmentState } from '../types';
import { resetAllState } from './authSlice.supabase';

const initialState: AppointmentState = {
  appointments: [],
  loading: false,
  error: null,
  selectedDate: null,
  selectedSlot: null,
};

// Async thunks for Supabase
export const bookAppointment = createAsyncThunk(
  'appointments/bookAppointment',
  async (appointmentData: {
    doctor_id: string;
    user_id: string;
    clinic_id: string;
    date: string;
    slot_id: any;
    status: string;
  }, { rejectWithValue }) => {
    try {
      const { data, error } = await createAppointment(appointmentData as any);
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserAppointments = createAsyncThunk(
  'appointments/fetchUserAppointments',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await getUserAppointments(userId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// New role-based appointment fetching
export const fetchAppointmentsByRole = createAsyncThunk(
  'appointments/fetchAppointmentsByRole',
  async (
    { userId, userRole, doctorId }: { 
      userId: string; 
      userRole: 'consumer' | 'doctor'; 
      doctorId?: string;
    }, 
    { rejectWithValue, getState }
  ) => {
    try {      
      // For doctors, try to get doctorId from Redux state if not provided
      let finalDoctorId = doctorId;
      if (userRole === 'doctor' && !finalDoctorId) {
        const state = getState() as any;
        const doctorData = state.auth?.doctorData;
        if (doctorData?.doctor?.id) {
          finalDoctorId = doctorData.doctor.id;
          console.log('Using doctor ID from Redux state:', finalDoctorId);
        }
      }
      console.log('Fetching appointments by role:', { userId, userRole, doctorId: finalDoctorId });
      const { data, error } = await getAppointmentsByRole(userId, userRole, finalDoctorId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Fetched appointments by role:', data || 0);
      return data || [];
    } catch (error: any) {
      console.error('Error in fetchAppointmentsByRole:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDoctorAppointments = createAsyncThunk(
  'appointments/fetchDoctorAppointments',
  async (doctorId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await getDoctorAppointments(doctorId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setSelectedSlot: (state, action) => {
      state.selectedSlot = action.payload;
    },
    clearSelectedDateTime: (state) => {
      state.selectedDate = null;
      state.selectedSlot = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAppointmentStatus: (state, action) => {
      const { appointmentId, status } = action.payload;
      const appointment = state.appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        appointment.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Book Appointment
      .addCase(bookAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.appointments.unshift(action.payload);
        }
        state.selectedDate = null;
        state.selectedSlot = null;
        state.error = null;
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch User Appointments
      .addCase(fetchUserAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.error = null;
      })
      .addCase(fetchUserAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Appointments by Role (new)
      .addCase(fetchAppointmentsByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentsByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.error = null;
      })
      .addCase(fetchAppointmentsByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Doctor Appointments
      .addCase(fetchDoctorAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.error = null;
      })
      .addCase(fetchDoctorAppointments.rejected, (state, action) => {
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
  setSelectedDate, 
  setSelectedSlot, 
  clearSelectedDateTime, 
  clearError,
  updateAppointmentStatus 
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
