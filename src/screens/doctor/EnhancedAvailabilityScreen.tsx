import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../../components/Button';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { useAppSelector } from '../../redux/hooks';

// Services
import {
  AvailabilitySlot,
  createMultipleAvailabilities,
  generateTimeSlots,
  getDoctorClinicAvailability
} from '../../services/availabilityService';
import { Clinic } from '../../services/clinicService';
import { getCurrentDoctorProfile, getDoctorClinics } from '../../services/doctorService';

export const EnhancedAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const { modalState, showSuccess, showError, hideModal } = useModal();
  
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlots, setTimeSlots] = useState<AvailabilitySlot[]>([]);
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  
  // Time slot generation settings
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [slotDuration, setSlotDuration] = useState(30);
  const [hasLunchBreak, setHasLunchBreak] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    loadDoctorData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedClinic && selectedDate && doctorId) {
      generateDefaultSlots();
    }
  }, [selectedClinic, selectedDate, doctorId, slotDuration, isFocused]);

  useEffect(() => {
    if (selectedClinic && selectedDate && doctorId) {
      loadExistingAvailability();
    }
  }, [selectedClinic, selectedDate, doctorId, isFocused]);

  const loadDoctorData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get doctor profile
      const result = await getCurrentDoctorProfile(user.id);
      
      if (result.error || !result.data?.doctor?.id) {
        Alert.alert('Error', 'Doctor profile not found. Please complete your profile first.');
        return;
      }
      
      const doctor = result.data.doctor;
      
      // Check if clinics are added
      if (!doctor.clinics_added) {
        Alert.alert(
          'Clinics Required', 
          'Please add clinics where you practice before creating availability slots.'
        );
        return;
      }
      
      setDoctorId(doctor.id);
      
      // Load doctor's clinics
      const doctorClinics = await getDoctorClinics(doctor.id);
      setClinics(doctorClinics);
      
      if (doctorClinics.length === 1) {
        setSelectedClinic(doctorClinics[0]);
      }
      
      // Generate default time slots
      generateDefaultSlots();
    } catch (error) {
      console.error('Error loading doctor data:', error);
      showError('Loading Failed', 'Failed to load doctor information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAvailability = async () => {
    if (!doctorId || !selectedClinic) return;
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const existing = await getDoctorClinicAvailability(doctorId, selectedClinic.id, dateStr);
      setExistingSlots(existing);
    } catch (error) {
      console.error('Error loading existing availability:', error);
    }
  };

  const generateDefaultSlots = () => {
    const breakHours = hasLunchBreak ? [12, 13] : [];
    const slots = generateTimeSlots(startHour, endHour, slotDuration, breakHours);
    setTimeSlots(slots);
  };

  const handleTimeSettingsChange = () => {
    generateDefaultSlots();
  };

  const handleRemoveSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomSlot = () => {
    const now = new Date();
    const startTime = new Date(now.setHours(9, 0, 0, 0));
    const endTime = new Date(now.setHours(10, 0, 0, 0));
    
    setTimeSlots(prev => [...prev, { startTime, endTime }]);
  };

  const handleCreateAvailability = async () => {
    if (!doctorId || !selectedClinic) {
      Alert.alert('Error', 'Please select a clinic and ensure doctor profile is loaded.');
      return;
    }

    if (timeSlots.length === 0) {
      Alert.alert('No Slots', 'Please add at least one time slot.');
      return;
    }

    try {
      setLoading(true);
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Create availability slots
      await createMultipleAvailabilities(doctorId, selectedClinic.id, dateStr, timeSlots);
      
      // Note: availability_created flag is now automatically updated by database triggers
      
      // Reload existing slots
      await loadExistingAvailability();
      
      // Reset form
      setTimeSlots([]);
      generateDefaultSlots();
      
      showSuccess(
        'Availability Created!',
        `Successfully created ${timeSlots.length} time slots for ${selectedDate.toDateString()} at ${selectedClinic.name}.`,
        () => {
          hideModal();
          // Navigate back to onboarding after creating first availability
          navigation.goBack();
        }
      );
    } catch (error) {
      console.error('Error creating availability:', error);
      showError(
        'Creation Failed', 
        'Failed to create availability slots. Please check for overlapping times and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderTimeSlot = (slot: AvailabilitySlot, index: number) => (
    <View key={index} style={styles.timeSlotItem}>
      <View style={styles.timeSlotInfo}>
        <Text style={styles.timeSlotText}>
          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
        </Text>
        <Text style={styles.timeSlotDuration}>
          {Math.round((slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60))} min
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveSlot(index)}
      >
        <Icon name="close" size={16} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderExistingSlot = (slot: any) => (
    <View key={slot.id} style={[styles.timeSlotItem, styles.existingSlot]}>
      <View style={styles.timeSlotInfo}>
        <Text style={styles.timeSlotText}>
          {slot.start_time} - {slot.end_time}
        </Text>
        <Text style={styles.existingSlotLabel}>Already Created</Text>
      </View>
      <Icon name="check-circle" size={20} color={Colors.success} />
    </View>
  );

  // If no clinics, show message
  if (clinics.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Icon name="local-hospital" size={64} color={Colors.lightGray} />
          <Text style={styles.emptyTitle}>No Clinics Added</Text>
          <Text style={styles.emptySubtitle}>
            Please add clinics where you practice before creating availability slots.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, {fontSize: Typography.sizes.lg}]}>Create Availability</Text>
          <Text style={styles.subtitle}>
            Set your available time slots for appointments
          </Text>
        </View>

        {/* Clinic Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Clinic</Text>
          {clinics.map(clinic => (
            <TouchableOpacity
              key={clinic.id}
              style={[
                styles.clinicOption,
                selectedClinic?.id === clinic.id && styles.selectedClinicOption
              ]}
              onPress={() => setSelectedClinic(clinic)}
            >
              <Icon 
                name={selectedClinic?.id === clinic.id ? 'radio-button-checked' : 'radio-button-unchecked'} 
                size={20} 
                color={selectedClinic?.id === clinic.id ? Colors.primary : Colors.lightGray} 
              />
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
                <Text style={styles.clinicAddress}>{clinic.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={20} color={Colors.primary} />
            <Text style={styles.dateSelectorText}>
              {selectedDate.toDateString()}
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Time Slot Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Slot Settings</Text>
          <View style={styles.settingsGrid}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Start Hour</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setStartHour(Math.max(6, startHour - 1));
                    handleTimeSettingsChange();
                  }}
                >
                  <Icon name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.settingValue}>{startHour}:00</Text>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setStartHour(Math.min(22, startHour + 1));
                    handleTimeSettingsChange();
                  }}
                >
                  <Icon name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>End Hour</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setEndHour(Math.max(startHour + 1, endHour - 1));
                    handleTimeSettingsChange();
                  }}
                >
                  <Icon name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.settingValue}>{endHour}:00</Text>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setEndHour(Math.min(23, endHour + 1));
                    handleTimeSettingsChange();
                  }}
                >
                  <Icon name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Slot Duration</Text>
              <View style={styles.settingControls}>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setSlotDuration(Math.max(15, slotDuration - 15));
                  }}
                >
                  <Icon name="remove" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.settingValue}>{slotDuration}m</Text>
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={() => {
                    setSlotDuration(Math.min(120, slotDuration + 15));
                  }}
                >
                  <Icon name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => {
                setHasLunchBreak(!hasLunchBreak);
                handleTimeSettingsChange();
              }}
            >
              <Icon 
                name={hasLunchBreak ? 'check-box' : 'check-box-outline-blank'} 
                size={20} 
                color={Colors.primary} 
              />
              <Text style={styles.checkboxLabel}>Lunch Break (12-1 PM)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Existing Slots */}
        {existingSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Existing Slots ({existingSlots.length})</Text>
            {existingSlots.map(renderExistingSlot)}
          </View>
        )}

        {/* New Time Slots */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Time Slots ({timeSlots.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCustomSlot}
            >
              <Icon name="add" size={16} color={Colors.white} />
              <Text style={styles.addButtonText}>Custom</Text>
            </TouchableOpacity>
          </View>

          {timeSlots.length === 0 ? (
            <View style={styles.emptySlots}>
              <Text style={styles.emptyText}>No time slots generated</Text>
              <Text style={styles.emptySubtext}>Adjust settings above or add custom slots</Text>
            </View>
          ) : (
            timeSlots.map(renderTimeSlot)
          )}
        </View>

        {/* Create Button */}
        {timeSlots.length > 0 && (
          <Button
            title={`Create ${timeSlots.length} Availability Slots`}
            onPress={handleCreateAvailability}
            loading={loading}
            style={styles.createButton}
          />
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={selectedDate}
        minimumDate={new Date()}
        onConfirm={(date) => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
      )}

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
    marginBottom: Spacing.md,
  },
  clinicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedClinicOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  clinicInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  clinicName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  clinicAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
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
  settingsGrid: {
    gap: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
    marginHorizontal: Spacing.md,
    minWidth: 40,
    textAlign: 'center',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  existingSlot: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '40',
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  timeSlotDuration: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  existingSlotLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.success,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  emptySlots: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  createButton: {
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
});
