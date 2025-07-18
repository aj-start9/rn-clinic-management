import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../components/Button';
import { SlotButton } from '../../components/SlotButton';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';
import { setSelectedDate, setSelectedSlot } from '../../redux/appointmentSlice.supabase';
import { fetchDoctorById } from '../../redux/doctorSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Clinic, TimeSlot } from '../../types';
import { RootStackParamList } from '../../types/navigation';

type DoctorDetailRouteProp = RouteProp<RootStackParamList, 'DoctorDetail'>;

export const DoctorDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DoctorDetailRouteProp>();
  const dispatch = useAppDispatch();
  
  const { selectedDoctor, loading } = useAppSelector((state) => state.doctors);
  const { selectedDate, selectedSlot } = useAppSelector((state) => state.appointments);
  
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const doctorId = route.params.doctorId;

  useEffect(() => {
    if (doctorId) {
      dispatch(fetchDoctorById(doctorId));
    }
  }, [dispatch, doctorId]);

  useEffect(() => {
    if (selectedDoctor?.clinics.length) {
      setSelectedClinic(selectedDoctor.clinics[0]);
    }
  }, [selectedDoctor]);

  if (!selectedDoctor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#DDD" />
      );
    }

    return stars;
  };

  const handleDateSelect = (date: string) => {
    dispatch(setSelectedDate(date));
    dispatch(setSelectedSlot(null));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    dispatch(setSelectedSlot(slot));
  };

  const handleBookAppointment = () => {
    if (selectedDate && selectedSlot && selectedClinic) {
      navigation.navigate('BookAppointment', {
        doctor: selectedDoctor,
        date: selectedDate,
        slot: selectedSlot,
        clinic: selectedClinic,
      });
    }
  };

  const availableDates = selectedDoctor.available_slots || [];
  const slotsForSelectedDate = selectedDate 
    ? availableDates.find(slot => slot.date === selectedDate)?.slots || []
    : [];

  const filteredSlots = selectedClinic
    ? slotsForSelectedDate.filter(slot => slot.clinic_id === selectedClinic.id)
    : slotsForSelectedDate;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Doctor Info */}
      <View style={styles.doctorInfo}>
        <Image source={{ uri: selectedDoctor.photo_url }} style={styles.doctorImage} />
        <View style={styles.doctorDetails}>
          <View style={styles.nameContainer}>
            <Text style={styles.doctorName}>{selectedDoctor.name}</Text>
            {selectedDoctor.verified && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
          </View>
          <Text style={styles.specialty}>{selectedDoctor.specialty}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(selectedDoctor.rating)}
            </View>
            <Text style={styles.ratingText}>
              {selectedDoctor.rating} ({selectedDoctor.experience_years} years exp.)
            </Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      {selectedDoctor.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{selectedDoctor.bio}</Text>
        </View>
      )}

      {/* Clinics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clinics</Text>
        {selectedDoctor.clinics.map((clinic) => (
          <TouchableOpacity
            key={clinic.id}
            style={[
              styles.clinicCard,
              selectedClinic?.id === clinic.id && styles.clinicCardSelected,
            ]}
            onPress={() => setSelectedClinic(clinic)}
          >
            <View style={styles.clinicInfo}>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicAddress}>{clinic.address}</Text>
            </View>
            <View style={styles.clinicIcon}>
              <Ionicons name="location" size={20} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Available Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Dates</Text>
        <FlatList
          data={availableDates}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => {
            const date = new Date(item.date);
            const isSelected = selectedDate === item.date;
            
            return (
              <TouchableOpacity
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                ]}
                onPress={() => handleDateSelect(item.date)}
              >
                <Text style={[
                  styles.dateDay,
                  isSelected && styles.dateDaySelected,
                ]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.dateNumber,
                  isSelected && styles.dateNumberSelected,
                ]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.datesList}
        />
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Times</Text>
          <View style={styles.slotsContainer}>
            {filteredSlots.map((slot) => (
              <SlotButton
                key={slot.id}
                slot={slot}
                selected={selectedSlot?.id === slot.id}
                onPress={() => handleSlotSelect(slot)}
              />
            ))}
          </View>
          {filteredSlots.length === 0 && (
            <Text style={styles.noSlotsText}>
              No available slots for this date
            </Text>
          )}
        </View>
      )}

      {/* Fee & Book Button */}
      <View style={styles.bookingSection}>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>${selectedDoctor.fee}</Text>
        </View>
        <Button
          title="Book Appointment"
          onPress={handleBookAppointment}
          disabled={!selectedDate || !selectedSlot || !selectedClinic}
          style={styles.bookButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  doctorDetails: {
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  doctorName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  specialty: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: Spacing.sm,
  },
  ratingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  bioText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  clinicCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary,
  },
  clinicInfo: {
    flex: 1,
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
  },
  clinicIcon: {
    marginLeft: Spacing.md,
  },
  datesList: {
    paddingHorizontal: Spacing.xs,
  },
  dateCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    minWidth: 60,
  },
  dateCardSelected: {
    backgroundColor: Colors.primary,
  },
  dateDay: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  dateDaySelected: {
    color: Colors.white,
  },
  dateNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  dateNumberSelected: {
    color: Colors.white,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noSlotsText: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  bookingSection: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  feeLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  feeAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  bookButton: {
    marginTop: Spacing.md,
  },
});
