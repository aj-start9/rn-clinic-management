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

// Database helpers - updated to use async client
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

    // Create profile only if user was created successfully
    if (data.user) {
      try {
        console.log('Attempting to create profile for user:', data.user.id);
        
        // Try to create profile with the authenticated user's session
        const { error: profileError } = await client
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              role,
              full_name: fullName,
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          // If it's an RLS error, provide specific guidance
          if (profileError.code === '42501') {
            console.error('❌ RLS Policy Error: The profiles table has Row Level Security enabled but no policy allows profile creation during signup.');
            console.error('💡 Solution: Run the SQL commands in fix-rls-policies.sql in your Supabase dashboard.');
            console.error('💡 Or set up a database trigger to automatically create profiles.');
          }
          
          // Don't fail the signup - profile can be created later
          // Return success but log the profile creation issue
          return { 
            data: {
              ...data,
              profileCreated: false,
              profileError: profileError.message
            }, 
            error: null 
          };
        } else {
          console.log('✅ Profile created successfully');
          return { 
            data: {
              ...data,
              profileCreated: true
            }, 
            error: null 
          };
        }
      } catch (profileException) {
        console.error('Profile creation exception:', profileException);
        // Don't fail the signup if profile creation fails
        return { 
          data: {
            ...data,
            profileCreated: false,
            profileError: profileException instanceof Error ? profileException.message : 'Unknown profile creation error'
          }, 
          error: null 
        };
      }
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
  
  if (user) {
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      ...user,
      role: profile?.role,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
      location: profile?.location,
    };
  }
  
  return null;
};

// Doctors
export const getDoctors = async () => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('doctors')
    .select('*')
    .order('rating', { ascending: false });
  
  return { data, error };
};

export const getDoctorById = async (id: string) => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
};

// Appointments
export const createAppointment = async (appointment: {
  doctor_id: string;
  user_id: string;
  clinic: any;
  date: string;
  slot: any;
  status: string;
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
  const client = await getSupabase();
  const { data, error } = await client
    .from('appointments')
    .select(`
      *,
      doctor:doctors(*)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: true });
  
  return { data, error };
};

export const getDoctorAppointments = async (doctorId: string) => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('appointments')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('doctor_id', doctorId)
    .order('date', { ascending: true });
  
  return { data, error };
};

export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single();
  
  return { data, error };
};

// Test function to debug Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const client = await getSupabase();
    
    if (!client) {
      throw new Error('Client is null');
    }
    
    if (!client.auth) {
      throw new Error('Auth service not available');
    }
    
    // Test basic auth functionality
    const { data: { user } } = await client.auth.getUser();
    console.log('Current user check successful:', user ? 'User logged in' : 'No user');
    
    // Test database connection
    const { data, error } = await client.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Database test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection test successful');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Utility function to debug signup issues step by step
export const debugSignUpProcess = async (email: string, password: string, role: 'consumer' | 'doctor', fullName: string) => {
  const debugInfo = {
    step: '',
    success: false,
    error: null as any,
    details: {} as any
  };

  try {
    debugInfo.step = 'Getting Supabase client';
    console.log('🔄 Step 1: Getting Supabase client...');
    const client = await getSupabase();
    
    if (!client) {
      throw new Error('Supabase client is null');
    }
    debugInfo.details.clientAvailable = true;

    debugInfo.step = 'Checking auth service';
    console.log('🔄 Step 2: Checking auth service...');
    if (!client.auth) {
      throw new Error('Auth service not available');
    }
    debugInfo.details.authServiceAvailable = true;

    debugInfo.step = 'Attempting signup';
    console.log('🔄 Step 3: Attempting signup...', { email, role, fullName });
    
    const signUpResult = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        }
      }
    });

    debugInfo.details.signUpResponse = {
      hasUser: !!signUpResult.data?.user,
      hasSession: !!signUpResult.data?.session,
      hasError: !!signUpResult.error,
      errorMessage: signUpResult.error?.message || null
    };

    if (signUpResult.error) {
      debugInfo.error = signUpResult.error;
      debugInfo.step = 'Signup failed';
      console.error('❌ Signup failed:', signUpResult.error);
      return debugInfo;
    }

    debugInfo.step = 'Signup successful';
    debugInfo.success = true;
    console.log('✅ Signup successful!');
    
    return debugInfo;

  } catch (error) {
    debugInfo.error = error;
    debugInfo.success = false;
    console.error(`❌ Debug failed at step "${debugInfo.step}":`, error);
    return debugInfo;
  }
};

// Alternative Supabase client configuration for problematic environments
export const createSimpleSupabaseClient = () => {
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Use password-based auth only (no PKCE)
        flowType: 'implicit',
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-react-native-simple',
        },
      },
    });
  } catch (error) {
    console.error('Failed to create simple Supabase client:', error);
    return null;
  }
};

// Helper function to create profile separately (useful if RLS blocks during signup)
export const createUserProfile = async (userId: string, role: 'consumer' | 'doctor', fullName: string) => {
  try {
    const client = await getSupabase();
    
    console.log('Creating profile for user:', { userId, role, fullName });
    
    const { data, error } = await client
      .from('profiles')
      .insert([
        {
          id: userId,
          role,
          full_name: fullName,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      
      if (error.code === '42501') {
        console.error('❌ RLS Policy prevents profile creation. Check your Supabase policies.');
      }
      
      return { data: null, error };
    }

    console.log('✅ Profile created successfully:', data);
    return { data, error: null };
    
  } catch (exception) {
    console.error('Profile creation exception:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown profile creation error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Function to check if user profile exists
export const getUserProfile = async (userId: string) => {
  try {
    const client = await getSupabase();
    
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (exception) {
    console.error('Get profile exception:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
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