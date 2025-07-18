import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppointmentCard } from '../../components/AppointmentCard';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { fetchDoctorAppointments } from '../../redux/appointmentSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Appointment } from '../../types';

export const DoctorDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { appointments, loading } = useAppSelector((state) => state.appointments);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchDoctorAppointments(user.id));
    }
  }, [dispatch, user?.id]);

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

      {/* Today's Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorAppointments' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {todayAppointments.length > 0 ? (
          <FlatList
            data={todayAppointments.slice(0, 3)}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={Colors.darkGray} />
            <Text style={styles.emptyText}>No appointments today</Text>
            <Text style={styles.emptySubtext}>Enjoy your free day!</Text>
          </View>
        )}
      </View>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorAppointments' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={upcomingAppointments.slice(0, 2)}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
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
});
