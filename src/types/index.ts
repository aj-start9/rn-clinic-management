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
  specialty_id: string;
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
  phone?: string;
  email?: string;
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
  available: boolean;
  clinic_id: string;
}

export interface Appointment {
  user: any;
  slot: any;
  id: string;
  doctor_id: string;
  patient_id: string;
  clinic_id: string;
  availability_id?: string;
  date: string;
  status: 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  appointment_type?: string;
  fee_charged?: number;
  symptoms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    name: string;
    specialty: string;
    photo_url: string;
    fee: number;
  };
  clinic?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
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
  doctorData: any | null; // Store doctor profile data for doctors
  loading: boolean;
  error: string | null;
  isDoctorOnboardingComplete: boolean;
  doctorOnboarded: boolean;
}

export interface DoctorState {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    specialty_id: string;
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
  availability: Record<string, AvailableSlot>;
  loading: boolean;
  error: string | null;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface SpecialtyState {
  specialties: Specialty[];
  loading: boolean;
  error: string | null;
  selectedSpecialtyId: string | null;
}
