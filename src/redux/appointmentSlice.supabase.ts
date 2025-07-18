import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createAppointment, getDoctorAppointments, getUserAppointments } from '../services/supabase';
import { AppointmentState } from '../types';

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
    clinic: any;
    date: string;
    slot: any;
    status: string;
  }, { rejectWithValue }) => {
    try {
      const { data, error } = await createAppointment(appointmentData);
      
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
