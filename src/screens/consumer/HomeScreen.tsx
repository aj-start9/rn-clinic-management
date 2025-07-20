import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar } from '../../components/Avatar';
import { DoctorCard } from '../../components/DoctorCard';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';
import { fetchDoctors } from '../../redux/doctorSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchSpecialties } from '../../redux/specialtySlice';

export const ConsumerHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { doctors, loading, error } = useAppSelector((state) => state.doctors);
  const { specialties, loading: specialtiesLoading } = useAppSelector((state) => state.specialties);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(fetchSpecialties());
  }, [dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const specialtyIcons: { [key: string]: string } = {
    'Cardiology': 'heart',
    'Cardiologist': 'heart',
    'Dermatology': 'medical',
    'Dermatologist': 'medical',
    'Pediatrics': 'happy',
    'Pediatrician': 'happy',
    'Orthopedics': 'bone',
    'Orthopedic': 'bone',
    'Neurology': 'brain',
    'Neurologist': 'brain',
    'Gynecology': 'woman',
    'Gynecologist': 'woman',
    'Dentistry': 'dental',
    'Dentist': 'dental',
    'Ophthalmology': 'eye',
    'Psychiatrist': 'library',
    'ENT Specialist': 'ear',
    // Add more mappings as needed
  };

  const healthTips = [
    { icon: 'water', tip: 'Drink 8 glasses of water daily', color: Colors.primary },
    { icon: 'walk', tip: 'Take a 30-minute walk', color: Colors.success },
    { icon: 'moon', tip: 'Get 7-8 hours of sleep', color: Colors.accent },
  ];

  const renderSpecialtyCard = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={styles.specialtyCard}
      onPress={() => {
        navigation.navigate('Doctors' as any, { specialty: item.id });
      }}
    >
      <View style={styles.specialtyIcon}>
        <Ionicons 
          name={specialtyIcons[item.name] as any || 'medkit-outline'} 
          size={28} 
          color={Colors.primary} 
        />
      </View>
      <Text style={styles.specialtyText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderHealthTip = ({ item }: { item: typeof healthTips[0] }) => (
    <View style={styles.healthTipCard}>
      <View style={[styles.healthTipIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={20} color={Colors.white} />
      </View>
      <Text style={styles.healthTipText}>{item.tip}</Text>
    </View>
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
      {/* Hero Header with Gradient Background */}
      <View style={styles.heroContainer}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar
              name={user?.full_name}
              role="consumer"
              size={50}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>10+</Text>
            <Text style={styles.statLabel}>Doctors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5+</Text>
            <Text style={styles.statLabel}>Specialties</Text>
          </View>
        </View>
      </View>

      {/* Health Tips */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, {marginBottom: 0}]}>
          <Text style={styles.sectionTitle}>Daily Health Tips</Text>
          {/* <TouchableOpacity>
            <Text style={styles.seeAllText}>See More</Text>
          </TouchableOpacity> */}
        </View>
        <FlatList
          data={healthTips}
          renderItem={renderHealthTip}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.healthTipsList}
        />
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>Popular Specialties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Doctors' as any, { specialty: "" })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {specialtiesLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading specialties...</Text>
          </View>
        ) : specialties.length > 0 ? (
          <FlatList
            data={specialties.slice(0, 6)}
            renderItem={renderSpecialtyCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesList}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No specialties available</Text>
          </View>
        )}
      </View>

      {/* Featured Doctors */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>Top Rated Doctors</Text>
          {/* <TouchableOpacity onPress={() => navigation.navigate('Doctors' as never)}>
            <Text style={styles.seeAllText}>View All ({doctors.length})</Text>
          </TouchableOpacity> */}
        </View>
        <View style={styles.doctorsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="medical" size={32} color={Colors.primary} />
              <Text style={styles.loadingText}>Finding the best doctors for you...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={32} color={Colors.error} />
              <Text style={styles.errorText}>Unable to load doctors</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => dispatch(fetchDoctors())}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : doctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No doctors available at the moment</Text>
            </View>
          ) : (
            doctors.slice(0, 3).map((doctor: any) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor.id })}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  notificationIcon: {
    padding: Spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  searchContainer: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.md,
    marginTop: -20,
    borderRadius: 16,
    ...Shadow.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    color: Colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  section: {
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
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
  },
  quickActionCard: {
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
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
  healthTipsList: {
    paddingLeft: Spacing.md,
  },
  healthTipCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    marginRight: Spacing.md,
    width: 280,
    marginVertical: Spacing.sm,
    ...Shadow.sm,
  },
  healthTipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  healthTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  healthTipDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  specialtiesList: {
    paddingHorizontal: Spacing.md,
  },
  specialtyCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    alignItems: 'center',
    minWidth: 100,
    marginVertical: Spacing.sm,
    marginTop: 0,
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
  doctorsContainer: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.sizes.md,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  healthTipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
