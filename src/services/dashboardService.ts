import { getSupabase } from './supabase';

// =====================================================
// DASHBOARD SERVICE - Doctor dashboard statistics and data
// =====================================================

// Get dashboard statistics for a doctor
export const getDoctorDashboardStats = async (doctorId: string) => {
  try {
    const client = await getSupabase();
    
    // Get appointment statistics
    const { data: appointmentStats, error: appointmentError } = await client
      .from('appointments')
      .select('status, date, created_at')
      .eq('doctor_id', doctorId);
    
    if (appointmentError) {
      console.error('Error fetching appointment stats:', appointmentError);
    }
    
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const stats = {
      totalAppointments: appointmentStats?.length || 0,
      todayAppointments: appointmentStats?.filter((app: any) => app.date === today).length || 0,
      weeklyAppointments: appointmentStats?.filter((app: any) => 
        new Date(app.date) >= thisWeek
      ).length || 0,
      monthlyAppointments: appointmentStats?.filter((app: any) => 
        new Date(app.date) >= thisMonth
      ).length || 0,
      completedAppointments: appointmentStats?.filter((app: any) => app.status === 'completed').length || 0,
      pendingAppointments: appointmentStats?.filter((app: any) => app.status === 'pending').length || 0,
      cancelledAppointments: appointmentStats?.filter((app: any) => app.status === 'cancelled').length || 0,
    };
    
    return { data: stats, error: null };
  } catch (exception) {
    console.error('Exception fetching dashboard stats:', exception);
    return { 
      data: null, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Get recent activity for doctor dashboard
export const getDoctorRecentActivity = async (doctorId: string, limit: number = 5) => {
  try {
    const client = await getSupabase();
    
    const { data: recentAppointments, error } = await client
      .from('appointments')
      .select(`
        *,
        patient:profiles!user_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent activity:', error);
      return { data: [], error };
    }
    
    // Transform to activity format
    const activities = recentAppointments?.map((appointment: any) => ({
      id: appointment.id,
      type: 'appointment',
      title: `Appointment with ${appointment.patient?.full_name || 'Patient'}`,
      subtitle: `${appointment.status} - ${appointment.date}`,
      timestamp: appointment.created_at,
      icon: 'calendar',
      data: appointment
    })) || [];
    
    return { data: activities, error: null };
  } catch (exception) {
    console.error('Exception fetching recent activity:', exception);
    return { 
      data: [], 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};

// Get doctor's availability status
export const getDoctorAvailabilityStatus = async (doctorId: string) => {
  try {
    const client = await getSupabase();
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayAvailability, error } = await client
      .from('availabilities')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('date', today)
      .eq('is_available', true);
    
    if (error) {
      console.error('Error fetching availability status:', error);
    }
    
    const { data: upcomingAvailability, error: upcomingError } = await client
      .from('availabilities')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('date', today)
      .eq('is_available', true)
      .limit(7);
    
    if (upcomingError) {
      console.error('Error fetching upcoming availability:', upcomingError);
    }
    
    return {
      data: {
        isAvailableToday: (todayAvailability?.length || 0) > 0,
        todaySlots: todayAvailability?.length || 0,
        upcomingAvailableDays: upcomingAvailability?.length || 0,
      },
      error: null
    };
  } catch (exception) {
    console.error('Exception fetching availability status:', exception);
    return { 
      data: {
        isAvailableToday: false,
        todaySlots: 0,
        upcomingAvailableDays: 0,
      }, 
      error: { 
        message: exception instanceof Error ? exception.message : 'Unknown error',
        code: 'EXCEPTION'
      } 
    };
  }
};
