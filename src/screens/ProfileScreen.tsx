import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { CustomModal } from '../components/CustomModal';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../constants/theme';
import { useModal } from '../hooks/useModal';
import { signOutUser } from '../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchUserStats } from '../redux/userStatsSlice';
export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { user, loading } = useAppSelector((state) => state.auth);
  const { stats, recentAppointments, loading: statsLoading, error: statsError } = useAppSelector((state) => state.userStats);
  const { modalState, showConfirm, showSuccess, hideModal } = useModal();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.full_name || '');
  const [editedLocation, setEditedLocation] = useState(user?.location || '');
  const [refreshing, setRefreshing] = useState(false);
 const isFocused = useIsFocused();
  const isDoctor = user?.role === 'doctor';

  // Fetch user stats on component mount
  useEffect(() => {
    if (user?.id && user?.role) {
      dispatch(fetchUserStats({ 
        userId: user.id, 
        userRole: user.role as 'consumer' | 'doctor' 
      }));
    }
  }, [dispatch, user?.id, user?.role, isFocused]);

  const handleRefresh = async () => {
   
  };

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      () => {
        dispatch(signOutUser());
      }
    );
  };

  const handleSaveProfile = () => {
    // In a real app, you would update the profile via API
    setIsEditing(false);
    showSuccess('Success', 'Profile updated successfully');
  };

  // Doctor-specific menu items
  const doctorMenuItems = [
    {
      icon: 'person-outline',
      title: 'Manage Profile',
      subtitle: 'Update professional details and clinics',
      onPress: () => navigation.navigate('DoctorProfileManagement' as never),
    },
    {
      icon: 'time-outline',
      title: 'Clinic Availability',
      subtitle: 'Manage your Clinic',
      onPress: () => navigation.navigate('ClinicManagement' as never),
    },
  ];

  // Consumer menu items
  const consumerMenuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => setIsEditing(true),
    },
  ];

  // Common menu items
  const commonMenuItems = [
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => navigation.navigate('HelpSupport' as never),
    },
    {
      icon: 'document-text-outline',
      title: 'Terms & Conditions',
      onPress: () => navigation.navigate('Terms' as never),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy Policy',
      onPress: () => navigation.navigate('PrivacyPolicy' as never),
    },
  ];

  const allMenuItems = isDoctor ? [...doctorMenuItems, ...commonMenuItems] : [...consumerMenuItems, ...commonMenuItems];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity key={item.title} style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
        <View style={styles.menuItemTextContainer}>
          <Text style={styles.menuItemText}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.darkGray} />
    </TouchableOpacity>
  );

  if (isEditing) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.editContainer}>
          <View style={styles.avatarContainer}>
            <Avatar
              name={user?.full_name}
              role={user?.role}
              size={120}
              editable={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={editedLocation}
              onChangeText={setEditedLocation}
              placeholder="Enter your location"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Role</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
              editable={false}
              placeholder="Role"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <Button
            title="Save Changes"
            onPress={handleSaveProfile}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar
          name={user?.full_name}
          role={user?.role}
          size={120}
        />
        <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleText}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
          </Text>
        </View>
      </View>

      {/* Profile Stats - 6 stats in 2 rows of 3 */}
      <View style={styles.statsMainContainer}>
        {/* First Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons 
              name={isDoctor ? "people-outline" : "calendar-outline"} 
              size={20} 
              color={Colors.primary} 
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : (stats?.totalAppointments || 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={20} 
              color={Colors.success} 
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : (stats?.completedAppointments || 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name="star-outline" 
              size={20} 
              color={Colors.warning} 
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : (stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0')}
            </Text>
          </View>
        </View>

        {/* Second Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={Colors.accent} 
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : (stats?.pendingAppointments || 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name="chatbubbles-outline" 
              size={20} 
              color={Colors.primary} 
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              {statsLoading ? '...' : (stats?.totalRatings || 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons 
              name={isDoctor ? "cash-outline" : "wallet-outline"} 
              size={20} 
              color={Colors.success} 
              style={styles.statIcon}
            />
            <Text style={styles.statNumber}>
              ${statsLoading ? '...' : (isDoctor ? (stats?.totalEarned || 0) : (stats?.totalSpent || 0))}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity Section */}
      {recentAppointments && recentAppointments.length > 0 && (
        <View style={styles.recentActivityContainer}>
          <Text style={[styles.sectionTitle, {padding: Spacing.sm}]}>Recent Appointments</Text>
          {recentAppointments.slice(0, 3).map((appointment, index) => (
            <View key={appointment.id} style={styles.recentAppointmentItem}>
              <View style={styles.appointmentIcon}>
                <Ionicons 
                  name="calendar-outline" 
                  size={16} 
                  color={Colors.primary} 
                />
              </View>
              <View style={styles.appointmentDetails}>
                <Text style={styles.appointmentTitle}>
                  {isDoctor 
                    ? appointment.users?.full_name || 'Patient' 
                    : appointment.doctors?.name || 'Doctor'
                  }
                </Text>
                <Text style={styles.appointmentDate}>
                  {new Date(appointment.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: appointment.status === 'completed' ? Colors.success : 
                                appointment.status === 'cancelled' ? Colors.error : Colors.warning 
              }]}>
                <Text style={styles.statusText}>
                  {appointment.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Error State */}
      {statsError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load profile data</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {allMenuItems.map(renderMenuItem)}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          loading={loading}
          loadingText="Logging out..."
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>

    <CustomModal
      isVisible={modalState.isVisible}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      primaryButtonText={modalState.primaryButtonText}
      secondaryButtonText={modalState.secondaryButtonText}
      onPrimaryPress={modalState.onPrimaryPress || hideModal}
      onSecondaryPress={modalState.onSecondaryPress}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  profileHeader: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    ...Shadow.sm,
  },
  profileName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  profileEmail: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    marginBottom: Spacing.md,
  },
  roleContainer: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Shadow.sm,
  },
  statsMainContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.lightGray,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  menuItemText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  menuItemSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginTop: 2,
  },
  logoutContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  editContainer: {
    padding: Spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
    opacity: 0.6,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  // Additional stats styles
  additionalStatsContainer: {
    backgroundColor: Colors.white,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: 0,
    ...Shadow.sm,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    width: '100%',
  },
  additionalStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  additionalStatLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  additionalStatValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginTop: 2,
  },
  // Recent activity styles
  recentActivityContainer: {
    backgroundColor: Colors.white,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  recentAppointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  appointmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  appointmentDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    fontWeight: Typography.weights.medium,
    textTransform: 'capitalize',
  },
  // Error state styles
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  errorText: {
    fontSize: Typography.sizes.md,
    color: Colors.error,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});
