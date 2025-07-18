import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { loadUser } from '../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { BookAppointmentScreen } from '../screens/consumer/BookAppointmentScreen';
import { DoctorDetailScreen } from '../screens/consumer/DoctorDetailScreen';
import { MainTabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen 
              name="DoctorDetail" 
              component={DoctorDetailScreen}
              options={{
                headerShown: true,
                title: 'Doctor Details',
              }}
            />
            <Stack.Screen 
              name="BookAppointment" 
              component={BookAppointmentScreen}
              options={{
                headerShown: true,
                title: 'Book Appointment',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
