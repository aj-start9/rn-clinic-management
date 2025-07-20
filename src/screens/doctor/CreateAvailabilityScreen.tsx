import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../../components/Button';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { checkDoctorOnboarding } from '../../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getDoctorClinics } from '../../services/doctorService';
import { createAvailability } from '../../services/supabase';

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
}

export const CreateAvailabilityScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isDoctorOnboardingComplete } = useAppSelector((state) => state.auth);
  const { modalState, showSuccess, showError, hideModal } = useModal();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'start' | 'end'>('start');
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: '1',
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
    },
  ]);

  // Check onboarding status on component mount
  useEffect(() => {
    const checkOnboardingAndLoadData = async () => {
      if (!user?.id) return;

      try {
        // Check if doctor onboarding is complete
        const isComplete = await dispatch(checkDoctorOnboarding(user.id)).unwrap();
        
        if (!isComplete) {
          Alert.alert(
            'Complete Your Profile',
            'Please complete your doctor profile and clinic information before creating availability slots.',
            [{ text: 'OK' }]
          );
          return;
        }

        // If onboarding is complete, get doctor profile and load clinics
        const { getCurrentDoctorProfile } = await import('../../services/doctorService');
        const doctorResult = await getCurrentDoctorProfile(user.id);
        
        if (doctorResult.data?.doctor?.id) {
          setDoctorId(doctorResult.data.doctor.id);
          const doctorClinics = await getDoctorClinics(doctorResult.data.doctor.id);
          setClinics(doctorClinics);
          
          if (doctorClinics.length === 1) {
            setSelectedClinic(doctorClinics[0]);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        showError('Failed to load doctor information', 'Please try again');
      }
    };

    checkOnboardingAndLoadData();
  }, [user?.id, dispatch, showError]);

  // If onboarding is not complete, show message
  if (!isDoctorOnboardingComplete || !doctorId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Icon name="person-add" size={64} color={Colors.lightGray} />
          <Text style={styles.emptySubtitle}>
            Please complete your doctor profile and clinic information before creating availability slots.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    }
  };

  const updateSlotTime = (slotId: string, timeType: 'start' | 'end', newTime: Date) => {
    setTimeSlots(timeSlots.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          [timeType === 'start' ? 'startTime' : 'endTime']: newTime,
        };
      }
      return slot;
    }));
  };

  const openTimePicker = (slotIndex: number, type: 'start' | 'end') => {
    setCurrentSlotIndex(slotIndex);
    setTimePickerType(type);
    setShowTimePicker(true);
  };

  const validateSlots = () => {
    for (const slot of timeSlots) {
      if (slot.startTime >= slot.endTime) {
        showError('Invalid Time', 'Start time must be before end time for all slots.');
        return false;
      }
    }

    // Check for overlapping slots
    const sortedSlots = [...timeSlots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
        showError('Overlapping Slots', 'Time slots cannot overlap. Please adjust the times.');
        return false;
      }
    }

    return true;
  };

  const handleSaveAvailability = async () => {
    if (!validateSlots()) {
      return;
    }

    if (!doctorId || !selectedClinic) {
      showError('Missing Information', 'Please ensure doctor profile is loaded and a clinic is selected.');
      return;
    }

    setLoading(true);

    try {
      // Convert time slots to the format expected by the database
      const availabilityData = timeSlots.map(slot => ({
        doctor_id: doctorId,
        clinic_id: selectedClinic.id,
        date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
        start_time: slot.startTime.toTimeString().slice(0, 5), // HH:MM format
        end_time: slot.endTime.toTimeString().slice(0, 5), // HH:MM format
        is_available: true,
      }));

      console.log('Creating availability:', availabilityData);

      // Save all slots to the database
      for (const slotData of availabilityData) {
        const { error } = await createAvailability(slotData);
        if (error) {
            console.error('Error creating availability:', error);
          throw new Error(error.message);
        }
      }

      showSuccess(
        'Availability Created!',
        `Successfully created ${timeSlots.length} time slot(s) for ${formatDate(selectedDate)} at ${selectedClinic.name}.`,
        () => {
          hideModal();
          // Reset form
          setTimeSlots([
            {
              id: '1',
              startTime: new Date(new Date().setHours(9, 0, 0, 0)),
              endTime: new Date(new Date().setHours(10, 0, 0, 0)),
            },
          ]);
          setSelectedDate(new Date());
        }
      );
    } catch (error: any) {
      console.error('Availability creation error:', error);
      showError('Creation Failed', error.message || 'Failed to create availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>Set your available time slots for appointments</Text>
          </View>
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {marginBottom: Spacing.sm}]}>Select Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-today" size={24} color={Colors.primary} />
              <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
              <Icon name="keyboard-arrow-down" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Time Slots */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Time Slots</Text>
              <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
                <Icon name="add" size={20} color={Colors.white} />
                <Text style={styles.addButtonText}>Add Slot</Text>
              </TouchableOpacity>
            </View>
            {timeSlots.map((slot, index) => (
              <View key={slot.id} style={styles.slotContainer}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotTitle}>Slot {index + 1}</Text>
                  {timeSlots.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeTimeSlot(slot.id)}
                    >
                      <Icon name="close" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => openTimePicker(index, 'start')}
                  >
                    <Icon name="schedule" size={20} color={Colors.primary} />
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeLabel}>Start Time</Text>
                      <Text style={styles.timeValue}>{formatTime(slot.startTime)}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.timeSeparator}>
                    <Icon name="arrow-forward" size={16} color={Colors.text.secondary} />
                  </View>

                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => openTimePicker(index, 'end')}
                  >
                    <Icon name="schedule" size={20} color={Colors.primary} />
                    <View style={styles.timeInfo}>
                      <Text style={styles.timeLabel}>End Time</Text>
                      <Text style={styles.timeValue}>{formatTime(slot.endTime)}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <Button
            title="Save Availability"
            onPress={handleSaveAvailability}
            variant="primary"
            loading={loading}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Time Picker Modal */}
      <DatePicker
        modal
        open={showTimePicker}
        date={currentSlotIndex !== null ? 
          (timePickerType === 'start' ? 
            timeSlots[currentSlotIndex].startTime : 
            timeSlots[currentSlotIndex].endTime
          ) : new Date()
        }
        mode="time"
        onConfirm={(time) => {
          if (currentSlotIndex !== null) {
            updateSlotTime(timeSlots[currentSlotIndex].id, timePickerType, time);
          }
          setShowTimePicker(false);
          setCurrentSlotIndex(null);
        }}
        onCancel={() => {
          setShowTimePicker(false);
          setCurrentSlotIndex(null);
        }}
      />
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
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  slotContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  slotTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  timeInfo: {
    marginLeft: Spacing.sm,
  },
  timeLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  timeSeparator: {
    paddingHorizontal: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  clinicSelector: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  clinicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clinicOptionLast: {
    borderBottomWidth: 0,
  },
  clinicOptionText: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  clinicOptionAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
});
