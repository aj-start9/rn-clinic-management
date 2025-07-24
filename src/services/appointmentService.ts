import { supabase } from './supabase';

export interface AppointmentData {
  doctor_id: string;
  user_id: string;
  appointment_date: string;
  slot_id: string;
  clinic_id: string;
}

export interface AppointmentResponse {
  success: boolean;
  appointment?: any;
  message?: string;
  error?: string;
}

/**
 * Consolidated Appointment Service with Hybrid Architecture
 * 
 * This service combines three approaches:
 * 1. Frontend Queries - Fast, direct database access for simple operations
 * 2. Database Triggers - Automatic validation, notifications, and data integrity
 * 3. Edge Functions - Complex workflows like booking with immediate confirmation
 */
class AppointmentService {
  
  // =============================================
  // EDGE FUNCTION METHODS (Complex Operations)
  // =============================================
  
  /**
   * Book appointment with immediate confirmation via Edge Function
   * Use this for: Immediate user feedback, complex notifications, payment processing
   */
  async createAppointmentWithConfirmation(data: AppointmentData): Promise<AppointmentResponse> {
    try {
      console.log('🚀 Calling edge function for appointment booking...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`https://cwfaicjqdlvnuxlkgkfs.supabase.co/functions/v1/book-appointment-with-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ appointmentData: data })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to book appointment');
      }

      return result;
    } catch (error) {
      console.error('Edge function booking error:', error);
      throw error;
    }
  }

  // =============================================
  // FRONTEND METHODS (Simple Operations)
  // =============================================
  
  /**
   * Simple appointment creation - relies on database triggers for complex operations
   * Use this for: Simple booking when edge functions are not needed
   */
  async createAppointment(data: AppointmentData): Promise<AppointmentResponse> {
    try {
      console.log('📝 Creating appointment via direct database insert...');
      
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: data.doctor_id,
          user_id: data.user_id,
          clinic_id: data.clinic_id,
          date: data.appointment_date,
          slot_id: data.slot_id,
          status: 'confirmed',
        })
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(error.message);
      }

      return {
        success: true,
        appointment,
        message: 'Appointment created successfully! You will receive confirmation shortly.'
      };
    } catch (error) {
      console.error('Simple appointment creation error:', error);
      throw error;
    }
  }

  /**
   * Get user's appointments
   */
  async getUserAppointments(userId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            id,
            full_name,
            specialty,
            phone,
            email
          )
        `)
        .eq('patient_id', userId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get doctor's appointments
   */
  async getDoctorAppointments(doctorId: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:users!patient_id (
            id,
            full_name,
            phone,
            email
          )
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string) {
    return this.updateAppointmentStatus(appointmentId, 'cancelled');
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string) {
    return this.updateAppointmentStatus(appointmentId, 'completed');
  }
}

export const appointmentService = new AppointmentService();
