import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AppointmentCard } from '../../components/AppointmentCard';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { fetchAppointmentsByRole } from '../../redux/appointmentSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getDoctorDashboardStats, getDoctorRecentActivity } from '../../services/dashboardService';
import { getDoctorClinics } from '../../services/doctorService';
import { Appointment } from '../../types';

export const DoctorDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user, doctorData } = useAppSelector((state) => state.auth);
  const { appointments, loading } = useAppSelector((state) => state.appointments);
   const isFocused = useIsFocused();
  // Local state for additional data
  const [clinics, setClinics] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {

      if (user?.id && user?.role === 'doctor' && doctorData?.data?.doctor?.id) {
        setDashboardLoading(true);
        
        try {
          // Get doctor ID from Redux state
          const doctorId = doctorData.data.doctor.id;

          // Fetch appointments using role-based API
          dispatch(fetchAppointmentsByRole({
            userId: user.id,
            userRole: 'doctor',
            doctorId
          }));
          // Fetch doctor's clinics
          const clinicsData = await getDoctorClinics(doctorId);
          setClinics(clinicsData || []);
          // Fetch dashboard statistics
          const { data: statsData } = await getDoctorDashboardStats(doctorId);
          if (statsData) {
            setDashboardStats(statsData);
          }
          // Fetch recent activity
          const { data: activityData } = await getDoctorRecentActivity(doctorId, 5);
          setRecentActivity(activityData || []);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setDashboardLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [dispatch, user?.id, user?.role, doctorData, isFocused]);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  const todayAppointments = appointments.filter((appointment: Appointment) => 
    appointment.date === todayString && 
    (appointment.status === 'confirmed' || appointment.status === 'pending')
  );

  const upcomingAppointments = appointments.filter((appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate > today && 
           (appointment.status === 'confirmed' || appointment.status === 'pending');
  });

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;
  const pendingAppointments = appointments.filter(app => app.status === 'pending').length;

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color={Colors.white} />
        </View>
      </View>
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

  const handleCompleteAppointment = (appointmentId: string) => {
    // In a real app, this would update the appointment status
    console.log('Complete appointment:', appointmentId);
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      userRole="doctor"
      onComplete={() => handleCompleteAppointment(item.id)}
    />
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>Dr. {user?.full_name || 'Doctor'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24}/>
          {pendingAppointments > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        {renderStatCard('Today\'s Appointments', todayAppointments.length, 'calendar', Colors.primary)}
        {renderStatCard('Total Appointments', totalAppointments, 'list', Colors.accent)}
        {renderStatCard('Completed', completedAppointments, 'checkmark-circle', Colors.success)}
        {renderStatCard('Pending', pendingAppointments, 'time', Colors.warning)}
      </View>

      {/* Clinics Overview */}
      {clinics.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Clinics</Text>
          <View style={styles.clinicsContainer}>
            {clinics.map((clinic, index) => (
              <View key={clinic.id || index} style={styles.clinicCard}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  <Text style={styles.clinicAddress} numberOfLines={2}>{clinic.address}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {recentActivity.slice(0, 3).map((activity, index) => (
              <View key={activity.id || index} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Ionicons name={activity.icon} size={16} color={Colors.primary} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle} numberOfLines={1}>{activity.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {renderQuickAction(
            'calendar',
            'View Schedule',
            () => navigation.navigate('DoctorAppointments' as never)
          )}
          {renderQuickAction(
            'time',
            'Availability',
            () => navigation.navigate('DoctorAvailability' as never)
          )}
          {renderQuickAction(
            'person',
            'Profile',
            () => navigation.navigate('Profile' as never)
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
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  seeAllText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
  clinicsContainer: {
    gap: Spacing.md,
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  clinicInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  clinicName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  clinicAddress: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    lineHeight: 18,
  },
  activityContainer: {
    gap: Spacing.sm,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  activitySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  activityTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    fontWeight: Typography.weights.medium,
  },
});
