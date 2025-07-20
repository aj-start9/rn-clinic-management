import { getSupabase } from './supabase';

// =====================================================
// CLINIC SERVICE - All clinic-related operations
// =====================================================

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface CreateClinicData {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

// Get all available clinics
export const getAllClinics = async (): Promise<Clinic[]> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('clinics')
    .select('*')
    .order('name');
    
  if (error) {
    throw new Error(`Failed to fetch clinics: ${error.message}`);
  }
  
  return data || [];
};

// Get clinic by ID
export const getClinicById = async (clinicId: string): Promise<Clinic | null> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch clinic: ${error.message}`);
  }
  
  return data;
};

// Create a new clinic
export const createClinic = async (clinicData: CreateClinicData): Promise<Clinic> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('clinics')
    .insert([clinicData])
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create clinic: ${error.message}`);
  }
  
  return data;
};

// Create clinic with doctor association (for backend trigger)
export const createClinicWithDoctorAssociation = async (
  clinicData: CreateClinicData, 
  doctorId: string
): Promise<Clinic> => {
  const client = await getSupabase();
  
  try {
    // Set session variable for the trigger to use
    await client.rpc('set_config', {
      setting_name: 'app.current_doctor_id',
      new_value: doctorId,
      is_local: true
    });
    
    // Create the clinic (trigger will handle association)
    const { data, error } = await client
      .from('clinics')
      .insert([clinicData])
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create clinic: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Update clinic
export const updateClinic = async (clinicId: string, clinicData: Partial<CreateClinicData>): Promise<Clinic> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('clinics')
    .update(clinicData)
    .eq('id', clinicId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update clinic: ${error.message}`);
  }
  
  return data;
};

// Search clinics by name or address
export const searchClinics = async (searchTerm: string): Promise<Clinic[]> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('clinics')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
    .order('name');
    
  if (error) {
    throw new Error(`Failed to search clinics: ${error.message}`);
  }
  
  return data || [];
};
