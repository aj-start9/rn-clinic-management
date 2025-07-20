import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../../components/Button';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { updateDoctorData } from '../../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchSpecialties, setSelectedSpecialty } from '../../redux/specialtySlice';
import { updateDoctorProfileWithSpecialty } from '../../services/doctorOnboardingService';
import { getCurrentDoctorProfile } from '../../services/doctorService';

export const DoctorOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user, doctorData } = useAppSelector((state) => state.auth);
  const { specialties, loading: specialtiesLoading, selectedSpecialtyId } = useAppSelector((state) => state.specialties);
  const { modalState, showSuccess, showError, hideModal } = useModal();
  const [loading, setLoading] = useState(false);
  console.log('DoctorOnboardingScreen mounted', user);
  // Doctor details form - simplified to single step
  const [formData, setFormData] = useState({
    fullName: '',
    specialty: '',
    specialtyId: '',
    experience: '',
    fee: '',
    bio: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load specialties from Redux on component mount
  useEffect(() => {
    if (specialties.length === 0) {
      dispatch(fetchSpecialties());
    }
  }, [dispatch, specialties.length]);

  // Set selected specialty when Redux state changes
  useEffect(() => {
    if (selectedSpecialtyId) {
      const selectedSpecialty = specialties.find(s => s.id === selectedSpecialtyId);
      if (selectedSpecialty) {
        setFormData(prev => ({
          ...prev,
          specialtyId: selectedSpecialtyId,
          specialty: selectedSpecialty.name
        }));
      }
    }
  }, [selectedSpecialtyId, specialties]);

  // Autofill form data when doctor data is available from Redux
  useEffect(() => {
    if (doctorData && doctorData.data && doctorData.data.doctor) {
      const doctor = doctorData.data.doctor;
      setFormData(prev => ({
        ...prev,
        fullName: doctor.full_name || '',
        specialty: doctor.specialty || '',
        specialtyId: doctor.specialty_id || '',
        experience: doctor.experience_years?.toString() || '',
        fee: doctor.fee?.toString() || '',
        bio: doctor.bio || '',
      }));
      
      // Also set the specialty in Redux if we have specialty_id
      if (doctor.specialty_id) {
        dispatch(setSelectedSpecialty(doctor.specialty_id));
      }
    }
  }, [doctorData, dispatch]);

  const validateDoctorForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (!formData.specialtyId.trim()) {
      errors.specialty = 'Specialty is required';
    }
    if (!formData.experience.trim()) {
      errors.experience = 'Experience is required';
    } else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
      errors.experience = 'Please enter valid years of experience';
    }
    if (!formData.fee.trim()) {
      errors.fee = 'Consultation fee is required';
    } else if (isNaN(Number(formData.fee)) || Number(formData.fee) <= 0) {
      errors.fee = 'Please enter valid consultation fee';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSpecialtySelect = (specialtyId: string, specialtyName: string) => {
    dispatch(setSelectedSpecialty(specialtyId));
    setFormData(prev => ({ 
      ...prev, 
      specialtyId,
      specialty: specialtyName 
    }));
    if (formErrors.specialty) {
      setFormErrors(prev => ({ ...prev, specialty: '' }));
    }
  };

  const handleComplete = async () => {
    if (!validateDoctorForm()) {
      return;
    }

    if (!user?.id) {
      showError('Error', 'User not found. Please try logging in again.');
      return;
    }

    setLoading(true);

    try {
      // Update doctor profile with specialty from Supabase
      console.log('Updating doctor profile with specialty...');
      const profileData = await updateDoctorProfileWithSpecialty(user.id, {
        full_name: formData.fullName,
        specialty_id: formData.specialtyId,
        experience_years: Number(formData.experience),
        fee: Number(formData.fee),
        bio: formData.bio || '',
      });

      console.log('Doctor profile updated successfully:', profileData);
      
      try {
        const updatedDoctorData = await getCurrentDoctorProfile(user.id);
        dispatch(updateDoctorData(updatedDoctorData));
      } catch (error) {
        console.log('Could not fetch updated doctor data:', error);
      }

      showSuccess(
        'Profile Complete!',
        'Your doctor profile has been saved successfully. You can now start receiving appointments.',
        () => {
          hideModal();
          // Simply go back to the master screen, which will handle the completion flow
          navigation.goBack();
        }
      );
    } catch (error: any) {
      console.error('Onboarding error:', error);
      showError('Profile Update Failed', error.message || 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f' }}
        style={styles.backgroundImage}
        blurRadius={2}
      />
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.subtitle}>
                Tell us about your medical expertise to start receiving appointments
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.stepTitle}>Doctor Information</Text>
              
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={[styles.inputWrapper, formErrors.fullName && styles.inputError]}>
                  <Icon name="person" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    editable={false}
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.text.secondary}
                    value={formData.fullName}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, fullName: text }));
                      if (formErrors.fullName) {
                        setFormErrors(prev => ({ ...prev, fullName: '' }));
                      }
                    }}
                  />
                </View>
                {formErrors.fullName && (
                  <Text style={styles.errorText}>{formErrors.fullName}</Text>
                )}
              </View>

              {/* Specialty */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specialty *</Text>
                <View style={[styles.inputWrapper, formErrors.specialty && styles.inputError]}>
                  <Icon name="local-hospital" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                  {specialties.length > 0 ? (
                    <TouchableOpacity 
                      style={[styles.input, styles.dropdownInput]} 
                      onPress={() => {
                        console.log('Specialty dropdown opened');
                      }}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText, 
                        !formData.specialtyId && styles.placeholderText
                      ]}>
                        {formData.specialtyId 
                          ? specialties.find(s => s.id === formData.specialtyId)?.name || 'Select specialty'
                          : 'Select specialty'
                        }
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder={specialtiesLoading ? "Loading specialties..." : "No specialties available"}
                      placeholderTextColor={Colors.text.secondary}
                      value=""
                      editable={false}
                    />
                  )}
                </View>
                {formErrors.specialty && (
                  <Text style={styles.errorText}>{formErrors.specialty}</Text>
                )}
                
                {/* Specialty Options */}
                {specialties.length > 0 && (
                  <ScrollView 
                    style={styles.specialtyOptions}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {specialties.map((specialty) => (
                      <TouchableOpacity
                        key={specialty.id}
                        style={[
                          styles.specialtyOption,
                          formData.specialtyId === specialty.id && styles.selectedSpecialty
                        ]}
                        onPress={() => handleSpecialtySelect(specialty.id, specialty.name)}
                        disabled={loading}
                      >
                        <Text style={[
                          styles.specialtyOptionText,
                          formData.specialtyId === specialty.id && styles.selectedSpecialtyText
                        ]}>
                          {specialty.name}
                        </Text>
                        {specialty.description && (
                          <Text style={styles.specialtyDescription}>
                            {specialty.description}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Experience */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Years of Experience *</Text>
                <View style={[styles.inputWrapper, formErrors.experience && styles.inputError]}>
                  <Icon name="work" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter years of experience"
                    placeholderTextColor={Colors.text.secondary}
                    value={formData.experience}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, experience: text }));
                      if (formErrors.experience) {
                        setFormErrors(prev => ({ ...prev, experience: '' }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {formErrors.experience && (
                  <Text style={styles.errorText}>{formErrors.experience}</Text>
                )}
              </View>

              {/* Fee */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Consultation Fee (₹) *</Text>
                <View style={[styles.inputWrapper, formErrors.fee && styles.inputError]}>
                  <Icon name="attach-money" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter consultation fee"
                    placeholderTextColor={Colors.text.secondary}
                    value={formData.fee}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, fee: text }));
                      if (formErrors.fee) {
                        setFormErrors(prev => ({ ...prev, fee: '' }));
                      }
                    }}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>
                {formErrors.fee && (
                  <Text style={styles.errorText}>{formErrors.fee}</Text>
                )}
              </View>

              {/* Bio */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bio (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell patients about yourself and your expertise"
                    placeholderTextColor={Colors.text.secondary}
                    value={formData.bio}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                </View>
              </View>

              <Button
                title="Complete Profile"
                onPress={handleComplete}
                variant="primary"
                loading={loading}
                style={styles.button}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText={modalState.primaryButtonText}
        onPrimaryPress={modalState.onPrimaryPress || hideModal}
        secondaryButtonText={modalState.secondaryButtonText}
        onSecondaryPress={modalState.onSecondaryPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.lg,
  },
  form: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  button: {
    marginTop: Spacing.lg,
  },
  // Specialty dropdown styles
  dropdownInput: {
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.secondary,
  },
  specialtyOptions: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    maxHeight: 200,
  },
  specialtyOption: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedSpecialty: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  specialtyOptionText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  selectedSpecialtyText: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  specialtyDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});
