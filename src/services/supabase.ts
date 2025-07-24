import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://cwfaicjqdlvnuxlkgkfs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmFpY2pxZGx2bnV4bGtna2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQyNDAsImV4cCI6MjA2ODM0MDI0MH0.d1jLd200AaZU76hmFgddmhqEIyhpEKiSKHSjEQoOjUs';

let supabaseClient: any = null;
let initializationPromise: Promise<any> | null = null;

const waitForRuntime = () => {
  return new Promise<void>((resolve) => {
    if (typeof global !== 'undefined' && (global as any).HermesInternal) {
      // On Hermes, wait for full initialization
      setTimeout(() => resolve(), 150);
    } else {
      resolve();
    }
  });
};

const initializeSupabaseClient = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('Starting Supabase client initialization...');
      
      // Wait for runtime to be ready
      await waitForRuntime();
      
      // Verify required globals are available
      if (typeof global.URL === 'undefined') {
        console.error('URL polyfill not ready');
        throw new Error('URL polyfill not ready');
      }
      
      // Test URL functionality
      try {
        const testUrl = new global.URL('https://test.com');
        if (!testUrl.protocol) {
          throw new Error('URL.protocol not implemented');
        }
      } catch (urlError) {
        console.error('URL test failed:', urlError);
        throw new Error('URL functionality test failed');
      }

      console.log('Creating Supabase client with config...');
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          // Use 'implicit' flow instead of 'pkce' to avoid crypto.subtle dependency
          flowType: 'implicit',
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-react-native',
          },
        },
      });

      // Verify the client was created properly
      if (!supabaseClient) {
        throw new Error('Failed to create Supabase client');
      }

      if (!supabaseClient.auth) {
        throw new Error('Supabase auth service not available');
      }

      console.log('✅ Supabase client initialized successfully');
      return supabaseClient;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      supabaseClient = null;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

const getSupabaseClient = async () => {
  if (!supabaseClient) {
    console.log('Initializing Supabase client...');
    await initializeSupabaseClient();
  }
  
  if (!supabaseClient) {
    throw new Error('Failed to initialize Supabase client');
  }
  
  return supabaseClient;
};

// Create a safer supabase client getter
export const getSupabase = async () => {
  return await getSupabaseClient();
};

// For backwards compatibility, export a sync getter that throws if not ready
export const supabase = {
  get auth() {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Use getSupabase() instead.');
    }
    return supabaseClient.auth;
  },
  from(table: string) {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Use getSupabase() instead.');
    }
    return supabaseClient.from(table);
  },
  storage: {
    from(bucket: string) {
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized. Use getSupabase() instead.');
      }
      return supabaseClient.storage.from(bucket);
    }
  }
};

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

export const signUp = async (email: string, password: string, role: 'consumer' | 'doctor', fullName: string) => {
  try {
    const client = await getSupabase();
    
    if (!client) {
      throw new Error('Supabase client not available');
    }

    console.log('Attempting to sign up user:', { email, role, fullName });

    // Check if client.auth is available
    if (!client.auth) {
      throw new Error('Supabase auth service not available');
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        }
      }
    });

    console.log('SignUp response:', { 
      user: data?.user ? 'User created' : 'No user', 
      session: data?.session ? 'Session created' : 'No session',
      error: error?.message || 'No error' 
    });

    if (error) {
      console.error('SignUp error:', error);
      return { data, error };
    }

    if (!data.user) {
      console.warn('SignUp successful but no user returned');
      return { data, error: null };
    }

    return { data, error };

  } catch (exception) {
    console.error('SignUp exception:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown signup error',
        status: 500
      } 
    };
  }
};

// Updated signup function that relies on database trigger for profile creation
export const signUpWithTrigger = async (email: string, password: string, role: 'consumer' | 'doctor', fullName: string) => {
  try {
    const client = await getSupabase();
    
    if (!client) {
      throw new Error('Supabase client not available');
    }

    console.log('Signing up user with database trigger:', { email, role, fullName });

    // Check if client.auth is available
    if (!client.auth) {
      throw new Error('Supabase auth service not available');
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        }
      }
    });

    console.log('SignUp response:', { 
      user: data?.user ? 'User created' : 'No user', 
      session: data?.session ? 'Session created' : 'No session',
      error: error?.message || 'No error' 
    });

    if (error) {
      console.error('SignUp error:', error);
      return { data, error };
    }

    if (!data.user) {
      console.warn('SignUp successful but no user returned');
      return { data, error: null };
    }

    console.log('✅ User signup successful. Profile will be created automatically by database trigger.');
    
    return { 
      data: {
        ...data,
        profileCreated: 'automatic',
        profileError: null
      }, 
      error: null 
    };

  } catch (exception) {
    console.error('SignUp exception:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown signup error',
        status: 500
      } 
    };
  }
};

export const signIn = async (email: string, password: string) => {
  const client = await getSupabase();
  return await client.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  const client = await getSupabase();
  return await client.auth.signOut();
};

export const getCurrentUser = async () => {
  const client = await getSupabase();
  const { data: { user } } = await client.auth.getUser();
  
  if (user?.id) {
    // Get profile with related doctor data in a single query
    const { data: profile } = await client
      .from('profiles')
      .select(`
        *,
        doctor:doctors(*)
      `)
      .eq('id', user.id)
      .single();
    
    console.log('Current user profile with doctor data:', profile);
    
    return {
      ...user,
      role: profile?.role,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
      location: profile?.location,
      doctorProfile: profile?.doctor || null,
      isDoctor: profile?.role === 'doctor',
      hasDoctorProfile: !!profile?.doctor,
      doctorData: profile?.doctor?.[0] || null,
    };
  }
  
  return null;
};

// =====================================================
// CLINIC FUNCTIONS  
// =====================================================

// Insert clinic
export const insertClinic = async (clinicData: {
  name: string;
  address: string;
  phone?: string;
  email?: string;
}) => {
  try {
    const client = await getSupabase();
    const { data, error } = await client
      .from('clinics')
      .insert([clinicData])
      .select()
      .single();
    
    return { data, error };
  } catch (exception) {
    console.error('Exception in insertClinic:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// =====================================================
// AVAILABILITY FUNCTIONS
// =====================================================

// Insert availability
export const insertAvailability = async (availabilityData: {
  doctor_id: string;
  clinic_id?: string;
  date: string;
  is_available?: boolean;
  max_appointments?: number;
}) => {
  try {
    const client = await getSupabase();
    
    const data = {
      ...availabilityData,
      is_available: availabilityData.is_available ?? true,
      max_appointments: availabilityData.max_appointments ?? 1,
    };
    
    const { data: result, error } = await client
      .from('availabilities')
      .insert([data])
      .select()
      .single();
    
    return { data: result, error };
  } catch (exception) {
    console.error('Exception in insertAvailability:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Alias for insertAvailability (better naming)
export const createAvailability = insertAvailability;

// =====================================================
// APPOINTMENT FUNCTIONS (for Redux slices)
// =====================================================

export const createAppointment = async (appointment: {
  doctor_id: string;
  user_id: string;
  clinic_id?: string;
  date: string;
  status: string;
  notes?: string;
}) => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('appointments')
    .insert([appointment])
    .select()
    .single();
  
  return { data, error };
};

export const getUserAppointments = async (userId: string) => {
  try {
    const client = await getSupabase();
    
    console.log('Fetching appointments for user:', userId);
    
    const { data, error } = await client
      .from('appointments')
      .select(`
        *,
        doctor:doctors(
          id,
          full_name,
          bio,
          specialty_id,
          photo_url,
          fee
        ),
        clinic:clinics(
          id,
          name,
          address,
          phone
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: true })
    
    if (error) {
      console.error('Error fetching user appointments:', error);
      return { data: null, error };
    }
    
    console.log('Fetched appointments:', data?.length || 0, 'appointments');
    console.log('Sample appointment:', data?.[0] ? JSON.stringify(data[0], null, 2) : 'No appointments');
    
    // Transform the data to match expected format
    const transformedAppointments = data?.map((appointment: any) => ({
      id: appointment.id,
      doctor_id: appointment.doctor_id,
      user_id: appointment.user_id,
      clinic_id: appointment.clinic_id,
      date: appointment.date,
      status: appointment.status,
      fee_charged: appointment.fee_charged,
      symptoms: appointment.symptoms,
      notes: appointment.notes,
      doctor: appointment.doctor ? {
        id: appointment.doctor.id,
        name: appointment.doctor.full_name,
        specialty: appointment.doctor.specialty,
        photo_url: appointment.doctor.photo_url,
        fee: appointment.doctor.fee
      } : null,
      clinic: appointment.clinic ? {
        id: appointment.clinic.id,
        name: appointment.clinic.name,
        address: appointment.clinic.address,
        phone: appointment.clinic.phone
      } : null,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at
    })) || [];
    
    return { data: transformedAppointments, error: null };
  } catch (exception) {
    console.error('Exception fetching user appointments:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Get appointments based on user role
export const getAppointmentsByRole = async (
  userId: string, 
  userRole: 'consumer' | 'doctor', 
  doctorId?: string
) => {
  try {
    const client = await getSupabase();
        
    if (userRole === 'consumer') {
      // For consumers, get appointments where they are the patient
      return await getUserAppointments(userId);
    } else if (userRole === 'doctor') {
      // For doctors, use the provided doctorId or fetch from database as fallback
      let finalDoctorId = doctorId;
      
      if (!finalDoctorId) {
        const { data: doctorData, error: doctorError } = await client
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (doctorError || !doctorData) {
          console.error('Error fetching doctor profile:', doctorError);
          return { data: [], error: null }; // Return empty array if doctor profile not found
        }
        
        finalDoctorId = doctorData.id;
      }
      
      // Get appointments where this doctor is assigned
      const { data, error } = await client
        .from('appointments')
        .select(`
          *,
          clinic:clinics(
            id,
            name,
            address,
            phone
          )
        `)
        .eq('doctor_id', finalDoctorId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching doctor appointments:', error);
        return { data: null, error };
      }
      
      
      // Get unique user IDs from appointments
      const userIds = [...new Set(data?.map((appointment: any) => appointment.user_id).filter(Boolean))];
      
      // Fetch all patient profiles in one query
      let patientsMap = new Map();
      if (userIds.length > 0) {
        const { data: patientsData, error: patientsError } = await client
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (patientsError) {
          console.error('Error fetching patients data:', patientsError);
        } else {
          // Create a map for quick lookup
          patientsData?.forEach((patient: any) => {
            patientsMap.set(patient.id, {
              id: patient.id,
              name: patient.full_name,
              photo_url: patient.avatar_url
            });
          });
          console.log('Fetched patients data:', patientsMap.size, 'patients');
        }
      }
      
      // Transform the data for doctor view (patient data already included from join)
      const transformedAppointments = data?.map((appointment: any) => ({
        id: appointment.id,
        doctor_id: appointment.doctor_id,
        user_id: appointment.user_id,
        clinic_id: appointment.clinic_id,
        date: appointment.date,
        status: appointment.status,
        fee_charged: appointment.fee_charged,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        user: patientsMap.get(appointment.user_id) || null,
        clinic: appointment.clinic ? {
          id: appointment.clinic.id,
          name: appointment.clinic.name,
          address: appointment.clinic.address,
          phone: appointment.clinic.phone
        } : null,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at
      })) || [];
      
      
      return { data: transformedAppointments, error: null };
    }
    
    return { data: [], error: null };
  } catch (exception) {
    console.error('Exception fetching role-based appointments:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};