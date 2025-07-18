import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { CustomModal } from '../components/CustomModal';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../constants/theme';
import { useModal } from '../hooks/useModal';
import { signOutUser } from '../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../redux/hooks';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { modalState, showConfirm, showSuccess, hideModal } = useModal();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.full_name || '');
  const [editedLocation, setEditedLocation] = useState(user?.location || '');

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

  const profileMenuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => setIsEditing(true),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      onPress: () => {},
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline',
      title: 'Terms & Conditions',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy Policy',
      onPress: () => {},
    },
  ];

  const renderMenuItem = (item: typeof profileMenuItems[0]) => (
    <TouchableOpacity key={item.title} style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
        <Text style={styles.menuItemText}>{item.title}</Text>
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
            <Image
              source={{
                uri: user?.avatar_url || 'https://via.placeholder.com/120',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </TouchableOpacity>
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{
            uri: user?.avatar_url || 'https://via.placeholder.com/120',
          }}
          style={styles.profileAvatar}
        />
        <Text style={styles.profileName}>{user?.full_name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleText}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
          </Text>
        </View>
      </View>

      {/* Profile Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {profileMenuItems.map(renderMenuItem)}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
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
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  profileName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
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
  statItem: {
    alignItems: 'center',
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
  },
  menuItemText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
});
