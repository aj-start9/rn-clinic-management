import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { checkDoctorOnboarding, checkStoredAuth } from '../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { BookAppointmentScreen } from '../screens/consumer/BookAppointmentScreen';
import { DoctorDetailScreen } from '../screens/consumer/DoctorDetailScreen';
import { ClinicManagementScreen } from '../screens/doctor/ClinicManagementScreen';
import { CreateAvailabilityScreen } from '../screens/doctor/CreateAvailabilityScreen';
import { DoctorOnboardingMasterScreen } from '../screens/doctor/DoctorOnboardingMasterScreen';
import { DoctorOnboardingScreen } from '../screens/doctor/DoctorOnboardingScreen';
import { DoctorProfileManagementScreen } from '../screens/doctor/DoctorProfileManagementScreen';
import { EnhancedAvailabilityScreen } from '../screens/doctor/EnhancedAvailabilityScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';
import { PrivacyPolicyScreen } from '../screens/profile/PrivacyPolicyScreen';
import { TermsScreen } from '../screens/profile/TermsScreen';
import { MainTabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isDoctorOnboardingComplete = false } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for stored authentication tokens and auto-login
    dispatch(checkStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    // Check doctor onboarding status after user is authenticated
    if (user && user.role === 'doctor') {
      dispatch(checkDoctorOnboarding(user.id));
    }
  }, [user, dispatch]);

    const darkTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'white', // Set background to transparent
    },
  };
  return (
    <NavigationContainer theme={darkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {/* Doctor Onboarding Screen */}
            {user.role == 'doctor' && !isDoctorOnboardingComplete && (
              <>
                <Stack.Screen
                  name="DoctorOnboarding"
                  component={DoctorOnboardingMasterScreen}
                  options={{
                    gestureEnabled: false,
                    headerShown: false,
                  }}
                />
              </>
            )}

            {/* Main App */}
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />

            {/* Consumer Screens */}
            <Stack.Screen
              name="DoctorDetail"
              component={DoctorDetailScreen}
              options={{
                headerShown: true,
                title: 'Doctor Details',
                headerBackButtonDisplayMode: 'minimal',
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

            {/* Doctor Screens */}
            <Stack.Screen
              name="CreateAvailability"
              component={CreateAvailabilityScreen}
              options={{
                headerShown: true,
                title: 'Create Availability',
                
              }}
            />

            {/* Doctor Onboarding Individual Screens */}
            <Stack.Screen
              name="DoctorProfile"
              component={DoctorOnboardingScreen}
              options={{
                headerShown: true,
                title: 'Complete Profile',
              }}
            />
            <Stack.Screen
              name="ClinicManagement"
              component={ClinicManagementScreen}
              options={{
                headerShown: true,
                title: 'Manage Clinics',
              }}
            />
            <Stack.Screen
              name="EnhancedAvailability"
              component={EnhancedAvailabilityScreen}
              options={{
                headerShown: true,
                title: 'Set Availability',
              }}
            />
            <Stack.Screen
              name="DoctorProfileManagement"
              component={DoctorProfileManagementScreen}
              options={{
                headerShown: true,
                title: 'Profile Management',
              }}
            />

            {/* Profile Screens */}
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{
                headerShown: true,
                title: 'Help & Support',
              }}
            />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{
                headerShown: true,
                title: 'Terms & Conditions',
              }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{
                headerShown: true,
                title: 'Privacy Policy',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
