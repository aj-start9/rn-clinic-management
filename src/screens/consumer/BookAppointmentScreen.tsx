import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { useNavigation } from '../../hooks/useNavigation';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { appointmentService } from '../../services/appointmentService';
import { RootStackParamList } from '../../types/navigation';

type BookAppointmentRouteProp = RouteProp<RootStackParamList, 'BookAppointment'>;

export const BookAppointmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BookAppointmentRouteProp>();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.appointments);
  const { modalState, showError, showSuccess, hideModal } = useModal();

  const { doctor, date, slot, clinic } = route.params;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleBookAppointment = async () => {
    if (!user || !doctor || !date || !slot || !clinic) {
      showError('Error', 'Missing appointment information');
      return;
    }

    try {
      // Choose approach based on your needs:

      // Option 1: Complex booking with immediate confirmation (Edge Function)
      const result = await appointmentService.createAppointmentWithConfirmation({
        doctor_id: doctor.id,
        user_id: user.id,
        appointment_date: date,
        slot_id: slot.id,
        clinic_id: clinic.id,
      });

      showSuccess(
        'Appointment Confirmed!',
        result.message || 'Your appointment has been booked and confirmation sent!',
        () => {
          hideModal();
          navigation.goBack();
        }
      );

    } catch (error: any) {
      console.error('Edge function booking failed:', error);

      // Fallback: Simple appointment creation (Triggers handle notifications)
      try {
        console.log('Trying fallback: simple appointment creation...');

        // This uses database triggers for all complex operations
        const result = await appointmentService.createAppointment({
          doctor_id: doctor.id,
          user_id: user.id,
          clinic_id: clinic.id,
          appointment_date: date,
          slot_id: slot.id,
        });

        showSuccess(
          'Appointment Booked!',
          'Your appointment has been successfully booked. You will receive a confirmation shortly.',
          () => {
            hideModal();
            navigation.goBack();
          }
        );

      } catch (fallbackError: any) {
        console.error('All booking methods failed:', fallbackError);
        showError('Error', fallbackError.message || 'Failed to book appointment. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!doctor || !date || !slot || !clinic) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Missing appointment information</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          {getGreeting()}, {user?.full_name || 'User'}
        </Text>
        <Text style={styles.subtitle}>Let's confirm your appointment</Text>
        {/* Doctor Info */}
        <View style={styles.card}>
          <View style={styles.doctorInfo}>
            <Avatar
              name={doctor.name}
              role="doctor"
              size={80}
              imageUrl={doctor.photo_url}
              avatarRole={doctor.id}
            />
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialty}>{doctor.specialty_id}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{doctor.rating}</Text>
                <Text style={styles.experience}>• {doctor.experience_years} years</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{slot.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Clinic</Text>
              <Text style={styles.detailValue}>{clinic.name}</Text>
              <Text style={styles.detailSubvalue}>{clinic.address}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Consultation Fee</Text>
            <Text style={styles.paymentValue}>${doctor.fee}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Platform Fee</Text>
            <Text style={styles.paymentValue}>$5</Text>
          </View>

          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>${doctor.fee + 5}</Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Important Notes</Text>
          <View style={styles.noteItem}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.noteText}>
              Please arrive 15 minutes before your appointment time
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="card-outline" size={16} color={Colors.primary} />
            <Text style={styles.noteText}>
              Payment will be processed after the consultation
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.noteText}>
              You can reschedule up to 2 hours before the appointment
            </Text>
          </View>
        </View>

        {/* Book Button */}
        <View style={styles.bookingContainer}>
          <Button
            title="Confirm Booking"
            onPress={handleBookAppointment}
            loading={loading}
            style={styles.bookButton}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sizes.lg,
    color: Colors.error,
    textAlign: 'center',
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  doctorName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  specialty: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  experience: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginLeft: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  detailContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  detailSubvalue: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginTop: Spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  paymentValue: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  noteText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  bookingContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  bookButton: {
    marginTop: Spacing.md,
  },
});
