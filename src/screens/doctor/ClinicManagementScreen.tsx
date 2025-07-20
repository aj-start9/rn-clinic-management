import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { useAppSelector } from '../../redux/hooks';

// Services
import { Clinic, CreateClinicData, createClinic } from '../../services/clinicService';
import {
  associateDoctorWithClinic,
  removeDoctorFromClinic
} from '../../services/doctorClinicService';
import { getCurrentDoctorProfile, getDoctorClinics } from '../../services/doctorService';

export const ClinicManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const { modalState, showSuccess, showError, hideModal } = useModal();

  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [doctorClinics, setDoctorClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create clinic form
  const [newClinic, setNewClinic] = useState<CreateClinicData>({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadDoctorData();
  }, [user?.id]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allClinics.filter(clinic =>
        clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clinic.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClinics(filtered);
    } else {
      setFilteredClinics(allClinics);
    }
  }, [searchTerm, allClinics]);

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

      setDoctorId(result?.data?.doctor?.id);  // Use doctor.id, not user_id

      // Load all clinics and doctor's clinics
      const [doctorClinicsData] = await Promise.all([
        getDoctorClinics(result.data.doctor.id)
      ]);

      setDoctorClinics(doctorClinicsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load clinic data', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateWithClinic = async (clinic: Clinic) => {
    if (!doctorId) return;

    // Check if already associated
    const isAlreadyAssociated = doctorClinics.some(dc => dc.id === clinic.id);
    if (isAlreadyAssociated) {
      Alert.alert('Already Associated', 'You are already associated with this clinic.');
      return;
    }

    try {
      setLoading(true);
      await associateDoctorWithClinic(doctorId, clinic.id);

      // Update local state
      setDoctorClinics(prev => [...prev, clinic]);

      // Note: clinics_added flag is now automatically updated by database triggers

      showSuccess(
        'Success',
        `Successfully associated with ${clinic.name}`,
        () => {
          hideModal();
          // Check if this was the first clinic - if so, navigate back to onboarding
          if (doctorClinics.length === 0) {
            navigation.goBack();
          }
        }
      );
    } catch (error) {
      console.error('Error associating with clinic:', error);
      showError('Association Failed', 'Failed to associate with clinic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromClinic = async (clinic: Clinic) => {
    if (!doctorId) return;

    Alert.alert(
      'Remove Association',
      `Are you sure you want to remove your association with ${clinic.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await removeDoctorFromClinic(doctorId, clinic.id);

              // Update local state
              setDoctorClinics(prev => prev.filter(dc => dc.id !== clinic.id));

              showSuccess('Success', `Removed association with ${clinic.name}`);
            } catch (error) {
              console.error('Error removing clinic association:', error);
              showError('Removal Failed', 'Failed to remove clinic association. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateClinic = async () => {
    if (!newClinic.name.trim() || !newClinic.address.trim()) {
      Alert.alert('Validation Error', 'Please fill in clinic name and address.');
      return;
    }

    if (!doctorId) {
      Alert.alert('Error', 'Doctor ID not found. Please try again.');
      return;
    }

    try {
      setLoading(true);

      // Create clinic with doctor_id as created_by - backend trigger will handle association
      const clinicData = {
        ...newClinic,
        created_by: doctorId  // Add doctor_id so trigger knows who created it
      };
      
      const createdClinic = await createClinic(clinicData);

      // Reset form
      setNewClinic({ name: '', address: '', phone: '', email: '' });
      setShowCreateForm(false);

      // Reload doctor data to get updated associations from backend trigger
      await loadDoctorData();

      showSuccess(
        'Success',
        `Created clinic ${createdClinic.name}. Association handled automatically.`,
        () => {
          hideModal();
          navigation.goBack();
        }
      );
    } catch (error) {
      console.error('Error creating clinic:', error);
      showError('Creation Failed', 'Failed to create clinic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderClinicItem = (clinic: Clinic, isAssociated: boolean) => (
    <View key={clinic.id} style={styles.clinicItem}>
      <View style={styles.clinicInfo}>
        <Text style={styles.clinicName}>{clinic.name}</Text>
        <Text style={styles.clinicAddress}>{clinic.address}</Text>
        {clinic.phone && (
          <Text style={styles.clinicContact}>📞 {clinic.phone}</Text>
        )}
        {clinic.email && (
          <Text style={styles.clinicContact}>✉️ {clinic.email}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.actionButton, isAssociated ? styles.removeButton : styles.addButton]}
        onPress={() => isAssociated ? handleRemoveFromClinic(clinic) : handleAssociateWithClinic(clinic)}
        disabled={loading}
      >
        <Icon
          name={isAssociated ? 'remove' : 'add'}
          size={20}
          color={Colors.white}
        />
      </TouchableOpacity>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Add or select clinics where you practice
          </Text>
        </View>

        {/* My Clinics Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {marginBottom: 10}]}>My Clinics ({doctorClinics.length})</Text>
          {doctorClinics.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="local-hospital" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No clinics added yet</Text>
            </View>
          ) : (
            doctorClinics.map(clinic => renderClinicItem(clinic, true))
          )}
        </View>

        {/* Available Clinics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Clinics</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Icon name="add" size={20} color={Colors.white} />
              <Text style={styles.createButtonText}>Create New</Text>
            </TouchableOpacity>
          </View>

          {/* Create Clinic Form */}
          {showCreateForm && (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>Create New Clinic</Text>

              <TextInput
                style={styles.input}
                placeholder="Clinic Name *"
                value={newClinic.name}
                onChangeText={(text) => setNewClinic(prev => ({ ...prev, name: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Address *"
                value={newClinic.address}
                onChangeText={(text) => setNewClinic(prev => ({ ...prev, address: text }))}
                multiline
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={newClinic.phone}
                onChangeText={(text) => setNewClinic(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={newClinic.email}
                onChangeText={(text) => setNewClinic(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.formActions}>
                <Button
                  title="Create Clinic"
                  onPress={handleCreateClinic}
                  loading={loading}
                  style={styles.submitButton}
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowCreateForm(false)}
                  variant="outline"
                  style={styles.cancelButton}
                />
              </View>
            </View>
          )}
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
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  createForm: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  formActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 0.45,
    marginTop: Spacing.sm,
  },
  submitButton: {
    flex: 0.45,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    marginLeft: Spacing.sm,
    color: Colors.text.primary,
  },
  clinicItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  clinicAddress: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  clinicContact: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  removeButton: {
    backgroundColor: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
});
