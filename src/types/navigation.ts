import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Clinic, Doctor, TimeSlot } from './index';

// Root Stack Navigation
export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  DoctorDetail: { doctorId: string };
  BookAppointment: {
    doctor: Doctor;
    date: string;
    slot: TimeSlot;
    clinic: Clinic;
  };
};

// Tab Navigation
export type TabParamList = {
  // Consumer Tabs
  Home: undefined;
  Search: undefined;
  Doctors: { specialty?: string };
  Appointments: undefined;
  Profile: undefined;
  
  // Doctor Tabs
  Dashboard: undefined;
  DoctorAppointments: undefined;
  DoctorAvailability: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
