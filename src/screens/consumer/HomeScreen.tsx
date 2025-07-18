import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DoctorCard } from '../../components/DoctorCard';
import { specialties } from '../../constants/dummyData';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';
import { fetchDoctors } from '../../redux/doctorSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

export const ConsumerHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { doctors, loading } = useAppSelector((state) => state.doctors);

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const featuredDoctors = doctors.slice(0, 3);

  const renderSpecialtyCard = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.specialtyCard}
      onPress={() => {
        // Navigate to the Doctors tab with specialty filter
        // For now, just navigate to Doctors tab - the filter can be set via other means
        navigation.navigate('Doctors' as any, { specialty: item });
      }}
    >
      <View style={styles.specialtyIcon}>
        <Ionicons name="medical" size={24} color={Colors.primary} />
      </View>
      <Text style={styles.specialtyText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderQuickAction = (icon: string, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon as any} size={28} color={Colors.primary} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {renderQuickAction(
            'search',
            'Find Doctor',
            () => navigation.navigate('Doctors' as any)
          )}
          {renderQuickAction(
            'calendar',
            'My Appointments',
            () => navigation.navigate('Appointments' as any)
          )}
          {renderQuickAction(
            'person',
            'Profile',
            () => navigation.navigate('Profile' as any)
          )}
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Doctors' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={specialties.slice(0, 4)}
          renderItem={renderSpecialtyCard}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesList}
        />
      </View>

      {/* Featured Doctors */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Doctors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorList' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {featuredDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
  },
  quickActionCard: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  specialtiesList: {
    paddingHorizontal: Spacing.lg,
  },
  specialtyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    alignItems: 'center',
    minWidth: 100,
    ...Shadow.sm,
  },
  specialtyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  specialtyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
});
