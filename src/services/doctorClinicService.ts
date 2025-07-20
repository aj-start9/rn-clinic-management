import { Clinic } from './clinicService';
import { getSupabase } from './supabase';

// =====================================================
// DOCTOR CLINIC SERVICE - Doctor-Clinic associations
// =====================================================

export interface DoctorClinic {
  id: string;
  doctor_id: string;
  clinic_id: string;
  created_at: string;
  clinic?: Clinic;
}

// Get all clinics where doctor works
export const getDoctorClinics = async (doctorId: string): Promise<Clinic[]> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('doctor_clinics')
    .select(`
      *,
      clinic:clinics(*)
    `)
    .eq('doctor_id', doctorId)
    .order('created_at');
    
  if (error) {
    throw new Error(`Failed to fetch doctor clinics: ${error.message}`);
  }
  
  return data?.map((dc: any) => dc.clinic).filter(Boolean) || [];
};

// Get all doctor-clinic associations with details
export const getDoctorClinicAssociations = async (doctorId: string): Promise<DoctorClinic[]> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('doctor_clinics')
    .select(`
      *,
      clinic:clinics(*)
    `)
    .eq('doctor_id', doctorId)
    .order('created_at');
    
  if (error) {
    throw new Error(`Failed to fetch doctor clinic associations: ${error.message}`);
  }
  
  return data || [];
};

// Associate doctor with clinic
export const associateDoctorWithClinic = async (doctorId: string, clinicId: string): Promise<DoctorClinic> => {
  const client = await getSupabase();
  
  // Check if association already exists
  const { data: existing } = await client
    .from('doctor_clinics')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('clinic_id', clinicId)
    .single();
    
  if (existing) {
    throw new Error('Doctor is already associated with this clinic');
  }
  
  const { data, error } = await client
    .from('doctor_clinics')
    .insert([{
      doctor_id: doctorId,
      clinic_id: clinicId
    }])
    .select(`
      *,
      clinic:clinics(*)
    `)
    .single();
    
  if (error) {
    throw new Error(`Failed to associate doctor with clinic: ${error.message}`);
  }
  
  return data;
};

// Remove doctor from clinic
export const removeDoctorFromClinic = async (doctorId: string, clinicId: string): Promise<void> => {
  const client = await getSupabase();
  const { error } = await client
    .from('doctor_clinics')
    .delete()
    .eq('doctor_id', doctorId)
    .eq('clinic_id', clinicId);
    
  if (error) {
    throw new Error(`Failed to remove doctor from clinic: ${error.message}`);
  }
};

// Check if doctor is associated with any clinics
export const hasDoctorClinics = async (doctorId: string): Promise<boolean> => {
  const client = await getSupabase();
  const { count, error } = await client
    .from('doctor_clinics')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId);
    
  if (error) {
    throw new Error(`Failed to check doctor clinics: ${error.message}`);
  }
  
  return (count || 0) > 0;
};
