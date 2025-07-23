import { configureStore } from '@reduxjs/toolkit';
import appointmentReducer from './appointmentSlice.supabase';
import authReducer from './authSlice.supabase';
import doctorReducer from './doctorSlice.supabase';
import specialtyReducer from './specialtySlice';
import userStatsReducer from './userStatsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctors: doctorReducer,
    appointments: appointmentReducer,
    specialties: specialtyReducer,
    userStats: userStatsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
