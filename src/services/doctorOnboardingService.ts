import { getCurrentDoctorProfile } from './doctorService';
import { getSupabase } from './supabase';
import { tokenService } from './tokenService';

// =====================================================
// DOCTOR ONBOARDING SERVICE - Track completion status
// =====================================================

export interface DoctorOnboardingStatus {
  doctorExists: boolean;
  profileCompleted: boolean;
  clinicsAdded: boolean;
  isComplete: boolean;
  doctorData?: any;
  specialties?: Specialty[];
  nextStep?: 'profile' | 'clinics' | 'complete';
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export interface OnboardingFlags {
  profile_completed?: boolean;
  clinics_added?: boolean;
}

// Get all available specialties
export const getAvailableSpecialties = async (): Promise<Specialty[]> => {
  try {
    const client = await getSupabase();
    const { data, error } = await client
      .from('specialties')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching specialties:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching specialties:', error);
    return [];
  }
};

// Check if doctor onboarding is complete
export const checkDoctorOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    // Use existing doctor profile function
    const result = await getCurrentDoctorProfile(userId);
    
    // If no doctor profile exists, logout and clear storage
    if (result.error || !result.data?.doctor) {
      console.log('Doctor profile not found, logging out user...');
      
      try {
        await tokenService.clearAll();
        const client = await getSupabase();
        await client.auth.signOut();
        console.log('User logged out due to missing doctor profile');
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }
      
      return false;
    }

    const doctor = result.data.doctor;
    
    // Check if all onboarding steps are complete
    return !!(doctor.profile_completed && doctor.clinics_added);
  } catch (error) {
    console.error('Error checking doctor onboarding status:', error);
    return false;
  }
};

// Get detailed doctor onboarding status (for master screen)
export const getDoctorOnboardingDetails = async (userId: string): Promise<DoctorOnboardingStatus> => {
  try {
    const result = await getCurrentDoctorProfile(userId);
    
    // If no doctor profile exists
    if (result.error || !result.data?.doctor) {
      return {
        doctorExists: false,
        profileCompleted: false,
        clinicsAdded: false,
        isComplete: false,
        nextStep: 'profile'
      };
    }

    const doctor = result.data.doctor;

    // Check flags from database
    const profileCompleted = !!doctor.profile_completed;
    const clinicsAdded = !!doctor.clinics_added;
    const isComplete = profileCompleted && clinicsAdded;

    // Determine next step
    let nextStep: 'profile' | 'clinics' | 'complete' = 'complete';
    if (!profileCompleted) nextStep = 'profile';
    else if (!clinicsAdded) nextStep = 'clinics';

    return {
      doctorExists: true,
      profileCompleted,
      clinicsAdded,
      isComplete,
      doctorData: doctor,
      nextStep
    };
  } catch (error) {
    console.error('Error getting doctor onboarding details:', error);
    return {
      doctorExists: false,
      profileCompleted: false,
      clinicsAdded: false,
      isComplete: false,
      nextStep: 'profile'
    };
  }
};

// Update doctor profile with specialty information from Supabase
export const updateDoctorProfileWithSpecialty = async (
  userId: string,
  profileData: {
    full_name?: string;
    specialty_id?: string;
    experience_years?: number;
    fee?: number;
    bio?: string;
  }
): Promise<any> => {
  try {
    const client = await getSupabase();

    // Prepare the data to insert/update
    const updateData = {
      ...profileData,
    };
    const { data, error } = await client
      .from('doctors')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update doctor profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Exception updating doctor profile with specialty:', error);
    throw error;
  }
};


// Get onboarding progress percentage
export const getOnboardingProgress = (status: DoctorOnboardingStatus): number => {
  let completed = 0;
  const total = 2;

  if (status.profileCompleted) completed++;
  if (status.clinicsAdded) completed++;

  return Math.round((completed / total) * 100);
};

// Get next onboarding step description
export const getNextStepDescription = (nextStep: string): string => {
  switch (nextStep) {
    case 'profile':
      return 'Complete your doctor profile with specialty, experience, and license information';
    case 'clinics':
      return 'Add or select clinics where you practice';
    case 'complete':
      return 'Onboarding complete! You can now receive appointment bookings';
    default:
      return 'Continue with onboarding process';
  }
};
