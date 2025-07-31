import { getSupabase, supabase } from './supabase';

export interface UserStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalRatings: number;
  totalSpent?: number; // For consumers
  totalEarned?: number; // For doctors
}

export class UserStatsService {
  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string, userRole: 'consumer' | 'doctor'): Promise<UserStats> {
    try {
      if (userRole === 'consumer') {
        return await this.getConsumerStats(userId);
      } else {
        return await this.getDoctorStats(userId);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get statistics for consumer users
   */
  private static async getConsumerStats(userId: string): Promise<UserStats> {
    // Get appointment statistics
    const client = await getSupabase()

    const { data: appointments, error: appointmentsError } = await client
      .from('appointments')
      .select('id, status')
      .eq('user_id', userId);

    if (appointmentsError) {
      console.error('Error fetching consumer appointments:', appointmentsError);
      return this.getDefaultStats();
    }

    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter((apt: any) => apt.status === 'completed').length || 0;
    const pendingAppointments = appointments?.filter((apt: any) => ['scheduled', 'confirmed'].includes(apt.status)).length || 0;
    const cancelledAppointments = appointments?.filter((apt: any) => apt.status === 'cancelled').length || 0;
    const totalSpent = appointments?.reduce((sum: number, apt: any) => sum + (apt.fee || 0), 0) || 0;

    // Get ratings given by this consumer (if ratings table exists)
    let totalRatings = 0;
    let averageRating = 0;
    
    try {
      const { data: ratings, error: ratingsError } = await client
        .from('appointment_ratings')
        .select('rating')
        .eq('patient_id', userId);

      if (!ratingsError && ratings) {
        totalRatings = ratings.length;
        averageRating = totalRatings > 0
          ? ratings.reduce((sum: any, r: any) => sum + r.rating, 0) / totalRatings
          : 0;
      }
    } catch (error) {
      // Ratings table might not exist yet - this is okay
      console.log('Ratings table not found, skipping ratings calculation');
    }

    return {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      averageRating,
      totalRatings,
      totalSpent,
    };
  }

  /**
   * Get statistics for doctor users
   */
  private static async getDoctorStats(userId: string): Promise<UserStats> {
    // Get appointment statistics
    const client = await getSupabase();
    const { data: appointments, error: appointmentsError } = await client
      .from('appointments')
      .select('*')
      .eq('doctor_id', userId);

    if (appointmentsError) {
      console.error('Error fetching doctor appointments:', appointmentsError);
      return this.getDefaultStats();
    }

    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter((apt: any) => apt.status === 'completed').length || 0;
    const pendingAppointments = appointments?.filter((apt: any) => ['scheduled', 'confirmed'].includes(apt.status)).length || 0;
    const cancelledAppointments = appointments?.filter((apt: any) => apt.status === 'cancelled').length || 0;
    const totalEarned = appointments?.filter((apt: any) => apt.status === 'completed')
      .reduce((sum: any, apt: any) => sum + (apt.fee || 0), 0) || 0;

    // Get ratings received by this doctor (if ratings table exists)
    let totalRatings = 0;
    let averageRating = 0;

    return {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      averageRating,
      totalRatings,
      totalEarned,
    };
  }

  /**
   * Get recent appointments for the user
   */
  static async getRecentAppointments(userId: string, userRole: 'consumer' | 'doctor', limit: number = 5) {
    try {
      const userField = userRole === 'consumer' ? 'user_id' : 'doctor_id';
      const userTable = userRole === 'consumer' ? 'users' : 'doctors';
      console.log('Fetching recent appointments for:', userId, userRole);
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          status,
          ${userRole === 'consumer' ? 'doctor_id, doctors(full_name, specialty_id)' : 'patient_id, users(full_name)'}
        `)
        .eq(userField, userId)
      if (error) {
        console.error('Error fetching recent appointments:', error);
        return [];
      }
      console.log('Recent appointments fetched:', appointments, userId, userRole);
      return appointments || [];
    } catch (error) {
      console.error('Error fetching recent appointments:', error);
      return [];
    }
  }

  /**
   * Get default stats when data fetch fails
   */
  private static getDefaultStats(): UserStats {
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      cancelledAppointments: 0,
      averageRating: 0,
      totalRatings: 0,
      totalSpent: 0,
      totalEarned: 0,
    };
  }

  /**
   * Refresh user stats cache (if using caching)
   */
  static async refreshUserStats(userId: string, userRole: 'consumer' | 'doctor'): Promise<UserStats> {
    // In a production app, you might want to implement caching here
    return await this.getUserStats(userId, userRole);
  }
}
