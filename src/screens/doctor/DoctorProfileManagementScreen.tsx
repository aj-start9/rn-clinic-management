import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../../components/Button';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useAppSelector } from '../../redux/hooks';
import { getAvailableSpecialties } from '../../services/doctorOnboardingService';
import { getCurrentDoctorProfile, updateDoctorProfile } from '../../services/doctorService';

interface Specialty {
  id: string;
  name: string;
}

interface DoctorProfile {
  specialty_id?: string;
  experience_years?: number;
  fee?: number;
  bio?: string;
  license_number?: string;
  education?: string;
  certifications?: string;
  languages?: string[];
}

interface TabInfo {
  id: string;
  title: string;
  icon: string;
}

const tabs: TabInfo[] = [
  { id: 'profile', title: 'Profile', icon: 'person' },
  { id: 'clinics', title: 'Clinics', icon: 'local-hospital' },
];

export const DoctorProfileManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  
  // Profile form state
  const [profileData, setProfileData] = useState<DoctorProfile>({
    specialty_id: '',
    experience_years: 0,
    fee: 0,
    bio: '',
    license_number: '',
    education: '',
    certifications: '',
    languages: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load doctor profile and specialties in parallel
      const [doctorResult, specialtiesData] = await Promise.all([
        getCurrentDoctorProfile(user.id),
        getAvailableSpecialties()
      ]);

      if (doctorResult.data?.doctor) {
        const doctor = doctorResult.data.doctor;
        setProfileData({
          specialty_id: doctor.specialty_id || '',
          experience_years: doctor.experience_years || 0,
          fee: doctor.fee || 0,
          bio: doctor.bio || '',
          license_number: doctor.license_number || '',
        //   education: doctor.education || '',
        //   languages: doctor.languages || [],
        });
      }

      setSpecialties(specialtiesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await updateDoctorProfile(user.id, profileData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderTabHeader = () => (
    <View style={styles.tabHeader}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            activeTab === tab.id && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Icon
            name={tab.icon}
            size={20}
            color={activeTab === tab.id ? Colors.white : Colors.darkGray}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === tab.id && styles.activeTabButtonText,
            ]}
          >
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        {/* Specialty Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Medical Specialty</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {specialties.find(s => s.id === profileData.specialty_id)?.name || 'Select Specialty'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color={Colors.darkGray} />
          </View>
        </View>

        {/* Experience Years */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={profileData.experience_years?.toString() || '0'}
            onChangeText={(text) =>
              setProfileData({ ...profileData, experience_years: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="Enter years of experience"
          />
        </View>

        {/* Consultation Fee */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Consultation Fee (₹)</Text>
          <TextInput
            style={styles.input}
            value={profileData.fee?.toString() || '0'}
            onChangeText={(text) =>
              setProfileData({ ...profileData, fee: parseInt(text) || 0 })
            }
            keyboardType="numeric"
            placeholder="Enter consultation fee"
          />
        </View>

        {/* License Number */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Medical License Number</Text>
          <TextInput
            style={styles.input}
            value={profileData.license_number || ''}
            onChangeText={(text) =>
              setProfileData({ ...profileData, license_number: text })
            }
            placeholder="Enter license number"
          />
        </View>

        <Text style={styles.sectionTitle}>Additional Information</Text>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profileData.bio || ''}
            onChangeText={(text) =>
              setProfileData({ ...profileData, bio: text })
            }
            placeholder="Tell patients about yourself"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Education */}
        {/* <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Education</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profileData.education || ''}
            onChangeText={(text) =>
              setProfileData({ ...profileData, education: text })
            }
            placeholder="Your medical education details"
            multiline
            numberOfLines={3}
          />
        </View> */}

        {/* Certifications */}
        {/* <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Certifications</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profileData.certifications || ''}
            onChangeText={(text) =>
              setProfileData({ ...profileData, certifications: text })
            }
            placeholder="Additional certifications and specializations"
            multiline
            numberOfLines={3}
          />
        </View> */}

        <Button
          title={loading ? 'Updating...' : 'Update Profile'}
          onPress={handleUpdateProfile}
          disabled={loading}
          style={styles.updateButton}
        />
      </View>
    </ScrollView>
  );

  const renderClinicsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Icon name="local-hospital" size={64} color={Colors.lightGray} />
        <Text style={styles.comingSoonTitle}>Clinic Management</Text>
        <Text style={styles.comingSoonText}>
          Clinic management features will be available here.{'\n'}
          You can add, edit, and manage your practice clinics.
        </Text>
        <Button
          title="Go to Clinic Management"
          onPress={() => {
            // @ts-ignore - Navigation will be typed later
            navigation.navigate('ClinicManagement');
          }}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  if (loading && activeTab === 'profile') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Manage your professional profile and clinics</Text>
      </View>

      {renderTabHeader()}

      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'clinics' && renderClinicsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    ...Typography.heading2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.darkGray,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.caption,
    color: Colors.darkGray,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: Colors.white,
  },
  tabContent: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  updateButton: {
    marginTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.darkGray,
    marginTop: Spacing.md,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  comingSoonTitle: {
    ...Typography.heading2,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  comingSoonText: {
    ...Typography.body,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    minWidth: 200,
  },
});
