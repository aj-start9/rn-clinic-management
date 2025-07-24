import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Colors } from '../constants/theme';
import { useAppSelector } from '../redux/hooks';

// Consumer Screens
import { AppointmentsScreen } from '../screens/consumer/AppointmentsScreen';
import { DoctorListScreen } from '../screens/consumer/DoctorListScreen';
import { ConsumerHomeScreen } from '../screens/consumer/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Doctor Screens
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoctorDashboardScreen } from '../screens/doctor/DashboardScreen';
import { EnhancedAvailabilityScreen } from '../screens/doctor/EnhancedAvailabilityScreen';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isDoctor = user?.role === 'doctor';

  if (isDoctor) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string = '';

            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'grid' : 'grid-outline';
                break;
              case 'DoctorAppointments':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case 'DoctorAvailability':
                iconName = focused ? 'time' : 'time-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.darkGray,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopColor: Colors.lightGray,
            paddingTop: 5,
            paddingBottom: 5,
            height: 50,
            shadowColor: Colors.white,
            shadowOpacity: 0,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DoctorDashboardScreen}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen
          name="DoctorAppointments"
          component={AppointmentsScreen}
          options={{ title: 'Appointments' }}
        />
        <Tab.Screen
          name="DoctorAvailability"
          component={EnhancedAvailabilityScreen}
          options={{ title: 'Availability' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: Colors.background }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string = '';

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Search':
                iconName = focused ? 'search' : 'search-outline';
                break;
              case 'Doctors':
                iconName = focused ? 'people' : 'people-outline';
                break;
              case 'Appointments':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.darkGray,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopColor: Colors.lightGray,
            paddingTop: 5,
            shadowOpacity: 0,
            height: 50,
            shadowColor: Colors.white,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Home"
          component={ConsumerHomeScreen}
          options={{ title: 'Home' }}
        />
        <Tab.Screen
          name="Doctors"
          component={DoctorListScreen}
          options={{ title: 'Doctors' }}
        />
        <Tab.Screen
          name="Appointments"
          component={AppointmentsScreen}
          options={{ title: 'Appointments' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};
