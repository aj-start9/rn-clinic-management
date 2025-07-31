import { getSupabase } from './supabase';

// =====================================================
// DOCTOR PROFILE FUNCTIONS
// =====================================================

// Get current doctor profile by user ID (enhanced version)
export const getCurrentDoctorProfile = async (userId: string) => {
  try {
    const client = await getSupabase();
    
    const { data: doctor, error } = await client
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching current doctor profile:', error);
      return { data: null, error };
    }
    
    // Transform the data to match the expected shape
    const result = {
      doctor: {
        id: doctor.id,
        user_id: doctor.user_id,
        full_name: doctor.full_name,
        specialty_id: doctor.specialty_id,
        experience_years: doctor.experience_years,
        license_number: doctor.license_number,
        fee: doctor.fee,
        bio: doctor.bio,
        photo_url: doctor.photo_url,
        profile_completed: doctor.profile_completed,
        clinics_added: doctor.clinics_added,
        availability_created: doctor.availability_created,
        education: doctor.education,
        certifications: doctor.certifications,
        languages: doctor.languages,
      }
    };
    
    return { data: result, error: null };
  } catch (exception) {
    console.error('Exception fetching current doctor profile:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Get doctor by user ID with clinic information (alias for backwards compatibility)
export const getDoctorByUserId = async (userId: string) => {
  return await getCurrentDoctorProfile(userId);
};

// Get doctor by ID (backwards compatibility)
export const getDoctorById = async (id: string) => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error };
};

// Get detailed doctor information with clinics and availability
export const getDoctorDetails = async (doctorId: string) => {
  try {
    const client = await getSupabase();
    
    console.log('Fetching detailed doctor information for ID:', doctorId);
    
    // Get doctor with clinics and availability
    const { data: doctorData, error: doctorError } = await client
      .from('doctors')
      .select(`
        *,
        doctor_clinics (
          clinic:clinics (
            id,
            name,
            address,
            phone,
            email
          )
        )
      `)
      .eq('id', doctorId)
      .single();
    
    if (doctorError) {
      console.error('Error fetching doctor details:', doctorError);
      return { data: null, error: doctorError };
    }
    
    // Get doctor's availability from availabilities table
    const { data: availabilityData, error: availabilityError } = await client
      .from('availabilities')
      .select(`
        *,
        clinic:clinics (
          id,
          name,
          address
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('is_available', true)
      .gte('date', new Date().toISOString().split('T')[0]) // Only future dates
      .order('date', { ascending: true })
    
    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      // Don't return error here, just log it and continue with empty availability
    }
    
    
    // Transform the data to match expected format
    const transformedDoctor = {
      id: doctorData.id,
      name: doctorData.full_name,
      specialty_id: doctorData.specialty_id || 'General Practice',
      experience_years: doctorData.experience_years || 0,
      rating: doctorData.rating || 0,
      fee: doctorData.fee || 0,
      photo_url: doctorData.photo_url || 'https://via.placeholder.com/120',
      bio: doctorData.bio,
      verified: doctorData.profile_completed || false,
      clinics: doctorData.doctor_clinics?.map((dc: any) => ({
        id: dc.clinic.id,
        name: dc.clinic.name,
        address: dc.clinic.address,
        phone: dc.clinic.phone,
        email: dc.clinic.email,
        location: { latitude: 0, longitude: 0 } // Default location
      })) || [],
      available_slots: transformAvailabilityToSlots(availabilityData || [])
    };
    
    console.log('Transformed doctor:', JSON.stringify(transformedDoctor, null, 2));
    
    return { data: transformedDoctor, error: null };
  } catch (exception) {
    console.error('Exception fetching doctor details:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Helper function to transform availability data into the expected slot format
const transformAvailabilityToSlots = (availabilityData: any[]) => {
  const slotsByDate = new Map();
  
  availabilityData.forEach((availability) => {
    const date = availability.date;
    
    if (!slotsByDate.has(date)) {
      slotsByDate.set(date, []);
    }
    
    slotsByDate.get(date).push({
      id: availability.id,
      clinic_id: availability.clinic_id,
      clinic_name: availability.clinic?.name,
      time: `${availability.start_time} - ${availability.end_time}`,
      available: true
    });
  });
  
  // Convert Map to array format expected by the component
  const availableSlots = Array.from(slotsByDate.entries()).map(([date, slots]) => ({
    date,
    slots
  }));
  
  return availableSlots;
};

// Get all doctors for listing (only those with completed profiles)
export const getDoctors = async () => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('doctors')
    .select(`
      *,
      profiles (
        avatar_url
      ),
      doctor_clinics (
        clinic:clinics (
          id,
          name,
          address
        )
      )
    `)
    .eq('profile_completed', true) // Only show doctors with completed profiles
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching doctors:', error);
    return { data: null, error };
  }

  // Transform the data to match the expected Doctor interface
  const transformedDoctors = data?.map((doctor: any) => ({
    id: doctor.id,
    name: doctor.full_name, // Map full_name to name
    specialty_id: doctor.specialty_id || 'General',
    experience_years: doctor.experience_years || 0,
    rating: 0, // Default rating since we don't have reviews yet
    fee: doctor.fee || 0,
    photo_url: doctor.photo_url || 'https://via.placeholder.com/60',
    clinics: doctor.doctor_clinics?.map((dc: any) => dc.clinic) || [], // Extract clinics from doctor_clinics
    available_slots: [], // Empty for now
    bio: doctor.bio,
    verified: doctor.profile_completed || false, // Use profile_completed as verified status
  })) || [];
  
  return { data: transformedDoctors, error: null };
};

// Get clinics for a specific doctor
export const getDoctorClinics = async (doctorId: string) => {
  try {
    const client = await getSupabase();
    
    const { data, error } = await client
      .from('doctor_clinics')
      .select(`
        clinic:clinics (
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq('doctor_id', doctorId);
    console.log('Doctor clinics data:', data);
    if (error) {
      console.error('Error fetching doctor clinics:', error);
      return [];
    }
    
    // Transform the data to flat clinic objects
    return data?.map((dc: any) => ({
      id: dc.clinic.id,
      name: dc.clinic.name,
      address: dc.clinic.address,
      phone: dc.clinic.phone,
      email: dc.clinic.email,
    })) || [];
  } catch (exception) {
    console.error('Exception fetching doctor clinics:', exception);
    return [];
  }
};


// Update existing doctor profile
export const updateDoctor = async (userId: string, doctorData: {
  full_name?: string;
  specialty_id?: string;
  experience_years?: number;
  license_number?: string;
  fee?: number;
  bio?: string;
  photo_url?: string;
}) => {
  try {
    const client = await getSupabase();
    
    const { data, error } = await client
      .from('doctors')
      .update(doctorData)
      .eq('user_id', userId)
      .select()
      .single();
    
    return { data, error };
  } catch (exception) {
    console.error('Exception in updateDoctor:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Link doctor to clinic
export const linkDoctorToClinic = async (doctorId: string, clinicId: string) => {
  try {
    const client = await getSupabase();
    const { data, error } = await client
      .from('doctor_clinics')
      .insert([{
        doctor_id: doctorId,
        clinic_id: clinicId
      }])
      .select()
      .single();
    
    return { data, error };
  } catch (exception) {
    console.error('Exception in linkDoctorToClinic:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Fetch doctor availability
export const fetchAvailability = async (doctorId: string, date?: string) => {
  try {
    const client = await getSupabase();
    let query = client
      .from('availabilities')
      .select(`
        *,
        clinic:clinics(name, address)
      `)
      .eq('doctor_id', doctorId)
      .eq('is_available', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (exception) {
    console.error('Exception in fetchAvailability:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Get doctor appointments
export const getDoctorAppointments = async (doctorId: string) => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('appointments')
    .select(`
      *,
      user:profiles(*),
      clinic:clinics(*)
    `)
    .eq('doctor_id', doctorId)
    .order('date', { ascending: true });
  
  return { data, error };
};

// Update doctor profile
export const updateDoctorProfile = async (userId: string, profileData: {
  specialty_id?: string;
  experience_years?: number;
  fee?: number;
  bio?: string;
  license_number?: string;
  education?: string;
  certifications?: string;
  languages?: string[];
}) => {
  try {
    const client = await getSupabase();

    const { data, error } = await client
      .from('doctors')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update doctor profile: ${error.message}`);
    }

    return { data, error: null };
  } catch (exception) {
    console.error('Exception updating doctor profile:', exception);
    throw exception;
  }
};
