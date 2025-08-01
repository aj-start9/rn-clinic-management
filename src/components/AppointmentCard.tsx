import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../constants/theme';
import { Appointment } from '../types';
import { Avatar } from './Avatar';
import { Button } from './Button';

interface AppointmentCardProps {
  appointment: Appointment;
  userRole: 'consumer' | 'doctor';
  onPress?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  userRole,
  onPress,
  onCancel,
  onComplete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'completed':
        return Colors.accent;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.darkGray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-done';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const displayName = userRole === 'consumer' 
    ? appointment.doctor?.name 
    : appointment.user?.name;
  
  // For consumers viewing appointments: they see doctors (role = 'doctor')
  // For doctors viewing appointments: they see patients/consumers (role = 'consumer')
  const avatarRole = userRole === 'consumer' ? 'doctor' : 'consumer';
  const avatarRoleId = userRole === 'consumer' 
    ? appointment.doctor?.id || appointment.doctor_id
    : appointment.user?.id || appointment.patient_id;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Avatar
          name={displayName}
          role={avatarRole}
          size={50}
          avatarRole={avatarRoleId}
          imageUrl={userRole === 'consumer' ? appointment.doctor?.photo_url : appointment.user?.avatar_url}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.dateTimeContainer}>
            <Ionicons name="calendar-outline" size={16} color={Colors.darkGray} />
            <Text style={styles.dateTime}>
              {formatDate(appointment.date)} • {appointment?.slot?.start_time}  
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Ionicons 
            name={getStatusIcon(appointment.status) as any} 
            size={16} 
            color={Colors.white} 
          />
        </View>
      </View>

      <View style={styles.clinicContainer}>
        <Ionicons name="location-outline" size={16} color={Colors.darkGray} />
        <Text style={styles.clinicText}>{appointment?.clinic?.name}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </Text>
      </View>

      {appointment.status === 'pending' && (
        <View style={styles.actions}>
          {userRole === 'doctor' && (
            <Button
              title="Complete"
              onPress={() => onComplete?.()}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
          )}
          {onCancel && (
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  specialty: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginLeft: Spacing.xs,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clinicText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginLeft: Spacing.xs,
  },
  statusContainer: {
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionButton: {
    minWidth: 80,
  },
});
