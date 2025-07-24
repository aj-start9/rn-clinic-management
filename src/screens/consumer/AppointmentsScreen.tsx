import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppointmentCard } from '../../components/AppointmentCard';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { fetchAppointmentsByRole, updateAppointmentStatus } from '../../redux/appointmentSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Appointment } from '../../types';

export const AppointmentsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { user, doctorData } = useAppSelector((state) => state.auth);
  const { appointments, loading, error } = useAppSelector((state) => state.appointments);
  const { modalState, showConfirm, hideModal } = useModal();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      // Use role-based appointment fetching
      // For doctors, pass the doctor ID from Redux state if available
      const doctorId = user.role === 'doctor' && doctorData?.doctor?.id 
        ? doctorData.doctor.id 
        : undefined;
        
      dispatch(fetchAppointmentsByRole({
        userId: user.id,
        userRole: user.role,
        doctorId
      }));
    }
  }, [dispatch, user, doctorData, isFocused]);

  const currentDate = new Date();
  
  const upcomingAppointments = appointments.filter((appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    const isUpcoming = appointmentDate >= currentDate && appointment.status !== 'completed' && appointment.status !== 'cancelled';
    return isUpcoming;
  });

  const pastAppointments = appointments.filter((appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    const isPast = appointmentDate < currentDate || appointment.status === 'completed' || appointment.status === 'cancelled';
    return isPast;
  });

  const handleCancelAppointment = (appointmentId: string) => {
    showConfirm(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      () => {
        dispatch(updateAppointmentStatus({ id: appointmentId, status: 'cancelled' }));
      }
    );
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      userRole={user?.role || 'consumer'}
      onCancel={() => handleCancelAppointment(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'upcoming' 
          ? 'Book your first appointment with a doctor'
          : 'Your appointment history will appear here'
        }
      </Text>
    </View>
  );

  const currentAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'past' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.activeTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <FlatList
        data={currentAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (user?.id && user.role) {
                const doctorId = user.role === 'doctor' && doctorData?.doctor?.id 
                  ? doctorData.doctor.id 
                  : undefined;
                  
                dispatch(fetchAppointmentsByRole({
                  userId: user.id,
                  userRole: user.role,
                  doctorId
                }));
              }
            }}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText={modalState.primaryButtonText}
        secondaryButtonText={modalState.secondaryButtonText}
        onPrimaryPress={modalState.onPrimaryPress || hideModal}
        onSecondaryPress={modalState.onSecondaryPress}
        onBackdropPress={hideModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.darkGray,
  },
  activeTabText: {
    color: Colors.white,
  },
  listContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
