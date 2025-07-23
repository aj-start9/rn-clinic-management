import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';
import { OnboardingUtils } from '../utils/onboardingUtils';

interface OnboardingSettingsProps {
  onOnboardingReset?: () => void;
}

export const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({ 
  onOnboardingReset 
}) => {
  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the welcome screens again when you restart the app. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await OnboardingUtils.resetOnboarding();
              Alert.alert(
                'Success',
                'Onboarding has been reset. Restart the app to see the welcome screens again.',
                [{ text: 'OK' }]
              );
              onOnboardingReset?.();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to reset onboarding. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding Settings</Text>
      <Text style={styles.description}>
        Reset the welcome experience to show it again on next app launch.
      </Text>
      
      <TouchableOpacity style={styles.resetButton} onPress={handleResetOnboarding}>
        <Ionicons name="refresh" size={20} color={Colors.white} />
        <Text style={styles.resetButtonText}>Reset Welcome Experience</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  resetButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.sm,
  },
});
