import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../../components/Button';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { setDoctorOnboarded } from '../../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

// Services
import {
    DoctorOnboardingStatus,
    getDoctorOnboardingDetails,
    getNextStepDescription,
    getOnboardingProgress
} from '../../services/doctorOnboardingService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  current: boolean;
  screen?: string;
}

export const DoctorOnboardingMasterScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { modalState, showError, hideModal } = useModal();
  
  const [loading, setLoading] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<DoctorOnboardingStatus | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadOnboardingStatus();
  }, [user?.id]);

  // Refresh onboarding status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOnboardingStatus();
    }, [user?.id])
  );

  const loadOnboardingStatus = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const status = await getDoctorOnboardingDetails(user.id);
      setOnboardingStatus(status);
      setProgress(getOnboardingProgress(status));
      
      // Update Redux state if onboarding is complete
      if (status.isComplete) {
        dispatch(setDoctorOnboarded(true));
        // Let React Navigation automatically handle the screen change
        // The AppNavigator will see isDoctorOnboardingComplete=true and show MainTabs
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      showError('Loading Failed', 'Failed to load onboarding status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getOnboardingSteps = (): OnboardingStep[] => {
    if (!onboardingStatus) return [];

    return [
      {
        id: 'profile',
        title: 'Complete Doctor Profile',
        description: 'Add your specialty, experience, license, and bio',
        icon: 'person',
        completed: onboardingStatus.profileCompleted,
        current: onboardingStatus.nextStep === 'profile',
        screen: 'DoctorProfile'
      },
      {
        id: 'clinics',
        title: 'Add Practice Clinics',
        description: 'Select or create clinics where you practice',
        icon: 'local-hospital',
        completed: onboardingStatus.clinicsAdded,
        current: onboardingStatus.nextStep === 'clinics',
        screen: 'ClinicManagement'
      }
    ];
  };

  const handleStepPress = (step: OnboardingStep) => {
    if (!step.screen) return;

    navigation.navigate(step.screen as never);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Onboarding Progress</Text>
        <Text style={styles.progressPercentage}>{progress}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
      </View>
      <Text style={styles.progressDescription}>
        {onboardingStatus ? getNextStepDescription(onboardingStatus.nextStep || 'complete') : ''}
      </Text>
    </View>
  );

  const renderStep = (step: OnboardingStep, index: number) => (
    <TouchableOpacity
      key={step.id}
      style={[
        styles.stepContainer,
        step.completed && styles.completedStep,
        step.current && styles.currentStep
      ]}
      onPress={() => handleStepPress(step)}
      disabled={loading}
    >
      <View style={styles.stepIconContainer}>
        <View style={[
          styles.stepIcon,
          step.completed && styles.completedStepIcon,
          step.current && styles.currentStepIcon
        ]}>
          <Icon 
            name={step.completed ? 'check' : step.icon} 
            size={24} 
            color={
              step.completed 
                ? Colors.white 
                : step.current 
                  ? Colors.white 
                  : Colors.lightGray
            } 
          />
        </View>
        {index < getOnboardingSteps().length - 1 && (
          <View style={[
            styles.stepConnector,
            step.completed && styles.completedConnector
          ]} />
        )}
      </View>
      
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text style={[
            styles.stepTitle,
            step.completed && styles.completedStepTitle,
            step.current && styles.currentStepTitle
          ]}>
            {step.title}
          </Text>
          {step.completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
          {step.current && !step.completed && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        <Text style={styles.stepDescription}>{step.description}</Text>
        
        {!step.completed && (
          <View style={styles.stepAction}>
            <Icon name="arrow-forward" size={16} color={Colors.primary} />
            <Text style={styles.stepActionText}>
              {step.current ? 'Start Now' : 'Continue'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading onboarding status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps = getOnboardingSteps();
  const isComplete = onboardingStatus?.isComplete;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Doctor Onboarding</Text>
          <Text style={styles.subtitle}>
            Complete these steps to start receiving appointment bookings
          </Text>
        </View>

        {renderProgressBar()}

        {isComplete ? (
          <View style={styles.completionContainer}>
            <Icon name="celebration" size={64} color={Colors.success} />
            <Text style={styles.completionTitle}>Onboarding Complete! 🎉</Text>
            <Text style={styles.completionMessage}>
              Your doctor profile is now complete and you can start receiving appointment bookings from patients.
            </Text>
            <Button
              title="Go to Dashboard"
              onPress={() => {
                dispatch(setDoctorOnboarded(true));
              }}
              style={styles.dashboardButton}
            />
          </View>
        ) : (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Setup Steps</Text>
            {steps.map(renderStep)}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('DoctorProfile' as never)}
            >
              <Icon name="person" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('ClinicManagement' as never)}
            >
              <Icon name="local-hospital" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Manage Clinics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('EnhancedAvailability' as never)}
            >
              <Icon name="schedule" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Set Availability</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={loadOnboardingStatus}
            >
              <Icon name="refresh" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText="OK"
        onPrimaryPress={hideModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  progressContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  progressPercentage: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  completionContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  completionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  dashboardButton: {
    minWidth: 200,
  },
  stepsContainer: {
    marginBottom: Spacing.xl,
  },
  stepsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  completedStep: {
    borderColor: Colors.success + '40',
    backgroundColor: Colors.success + '05',
  },
  currentStep: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  stepIconContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedStepIcon: {
    backgroundColor: Colors.success,
  },
  currentStepIcon: {
    backgroundColor: Colors.primary,
  },
  stepConnector: {
    width: 2,
    height: 30,
    backgroundColor: Colors.lightGray,
    marginTop: Spacing.sm,
  },
  completedConnector: {
    backgroundColor: Colors.success,
  },
  stepContent: {
    flex: 1,
    padding: Spacing.lg,
    paddingLeft: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  completedStepTitle: {
    color: Colors.success,
  },
  currentStepTitle: {
    color: Colors.primary,
  },
  completedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  completedBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    fontWeight: Typography.weights.medium,
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    fontWeight: Typography.weights.medium,
  },
  stepDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  stepAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepActionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  quickActionsContainer: {
    marginBottom: Spacing.xl,
  },
  quickActionsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
