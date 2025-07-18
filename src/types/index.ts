export interface User {
  id: string;
  email: string;
  role: 'consumer' | 'doctor';
  full_name?: string;
  avatar_url?: string;
  location?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience_years: number;
  rating: number;
  fee: number;
  photo_url: string;
  clinics: Clinic[];
  available_slots: AvailableSlot[];
  bio?: string;
  verified?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface AvailableSlot {
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  clinic_id: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  user_id: string;
  clinic: Clinic;
  date: string;
  slot: TimeSlot;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  doctor?: Doctor;
  user?: User;
}

export interface Profile {
  id: string;
  role: 'consumer' | 'doctor';
  full_name: string;
  avatar_url?: string;
  location?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface DoctorState {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    specialty: string;
    rating: number;
    experience: number;
  };
}

export interface AppointmentState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
}

export interface AvailabilityState {
  doctorAvailability: AvailableSlot[];
  loading: boolean;
  error: string | null;
}
