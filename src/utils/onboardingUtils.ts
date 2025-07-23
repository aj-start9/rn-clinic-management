import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility functions for onboarding management
 */
export class OnboardingUtils {
  /**
   * Reset onboarding status - useful for testing or allowing users to replay onboarding
   */
  static async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      console.log('✅ Onboarding status reset');
    } catch (error) {
      console.error('❌ Error resetting onboarding:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      return hasSeenOnboarding === 'true';
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('✅ Onboarding marked as completed');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      throw error;
    }
  }
}

// For debugging - you can call this in your development console
if (__DEV__) {
  // @ts-ignore
  global.resetOnboarding = OnboardingUtils.resetOnboarding;
  console.log('🔧 Development mode: Use global.resetOnboarding() to reset onboarding');
}
