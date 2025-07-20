import { getSupabase } from './supabase';

// =====================================================
// AVAILABILITY SERVICE - Doctor availability management
// =====================================================

export interface Availability {
  id: string;
  doctor_id: string;
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAvailabilityData {
  doctor_id: string;
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  max_appointments?: number;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
}

// Create single availability slot
export const createAvailability = async (availabilityData: CreateAvailabilityData): Promise<Availability> => {
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
    
  if (error) {
    throw new Error(`Failed to create availability: ${error.message}`);
  }
  
  return result;
};

// Create multiple availability slots at once
export const createMultipleAvailabilities = async (
  doctorId: string,
  clinicId: string,
  date: string,
  slots: AvailabilitySlot[]
): Promise<Availability[]> => {
  const client = await getSupabase();
  
  const availabilityData = slots.map(slot => ({
    doctor_id: doctorId,
    clinic_id: clinicId,
    date,
    start_time: slot.startTime.toTimeString().slice(0, 5), // HH:MM format
    end_time: slot.endTime.toTimeString().slice(0, 5), // HH:MM format
    is_available: true,
  }));
  
  const { data, error } = await client
    .from('availabilities')
    .insert(availabilityData)
    .select();
    
  if (error) {
    throw new Error(`Failed to create availabilities: ${error.message}`);
  }
  
  return data || [];
};

// Get doctor's availability for a specific date
export const getDoctorAvailability = async (
  doctorId: string, 
  date?: string
): Promise<Availability[]> => {
  const client = await getSupabase();
  let query = client
    .from('availabilities')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('is_available', true)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (date) {
    query = query.eq('date', date);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }
  
  return data || [];
};

// Get doctor's availability for a clinic on a specific date
export const getDoctorClinicAvailability = async (
  doctorId: string,
  clinicId: string,
  date: string
): Promise<Availability[]> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('availabilities')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .eq('is_available', true)
    .order('start_time', { ascending: true });
    
  if (error) {
    throw new Error(`Failed to fetch clinic availability: ${error.message}`);
  }
  
  return data || [];
};

// Update availability slot
export const updateAvailability = async (
  availabilityId: string,
  updates: Partial<CreateAvailabilityData>
): Promise<Availability> => {
  const client = await getSupabase();
  const { data, error } = await client
    .from('availabilities')
    .update(updates)
    .eq('id', availabilityId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update availability: ${error.message}`);
  }
  
  return data;
};

// Delete availability slot
export const deleteAvailability = async (availabilityId: string): Promise<void> => {
  const client = await getSupabase();
  const { error } = await client
    .from('availabilities')
    .delete()
    .eq('id', availabilityId);
    
  if (error) {
    throw new Error(`Failed to delete availability: ${error.message}`);
  }
};

// Check if doctor has any availability slots
export const hasDoctorAvailability = async (doctorId: string): Promise<boolean> => {
  const client = await getSupabase();
  const { count, error } = await client
    .from('availabilities')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId);
    
  if (error) {
    throw new Error(`Failed to check doctor availability: ${error.message}`);
  }
  
  return (count || 0) > 0;
};

// Generate time slots for a day (helper function)
export const generateTimeSlots = (
  startHour: number = 9,
  endHour: number = 17,
  slotDurationMinutes: number = 30,
  breakHours: number[] = [12, 13] // lunch break
): AvailabilitySlot[] => {
  const slots: AvailabilitySlot[] = [];
  const currentDate = new Date();
  
  for (let hour = startHour; hour < endHour; hour++) {
    // Skip break hours
    if (breakHours[0] ===( hour)) continue;
    
    for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, minute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + slotDurationMinutes);
      
      // Don't add slot if it goes beyond end hour
      if (endTime.getHours() >= endHour) break;
      
      slots.push({
        startTime,
        endTime
      });
    }
  }
  
  return slots;
};
