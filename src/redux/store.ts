import { configureStore } from '@reduxjs/toolkit';
import appointmentReducer from './appointmentSlice.supabase';
import authReducer from './authSlice.supabase';
import doctorReducer from './doctorSlice.supabase';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctors: doctorReducer,
    appointments: appointmentReducer,
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
