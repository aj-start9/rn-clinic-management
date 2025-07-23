import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../constants/theme';
import { useAppSelector } from '../redux/hooks';
import { Doctor } from '../types';
import { Avatar } from './Avatar';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onPress }) => {
  const specialties = useAppSelector((state: any) => state.specialties.specialties);
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#DDD" />
      );
    }

    return stars;
  };

  const getSpecialtyName = (specialtyId: string) => {
    return specialties.filter((spec: any) => spec.id === specialtyId)[0]?.name;
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Avatar
          name={doctor.name}
          role="doctor"
          size={60}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{doctor.name || 'Unknown Doctor'}</Text>
          <Text style={styles.specialty}>{getSpecialtyName(doctor.specialty_id)}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(doctor.rating)}
            </View>
            <Text style={styles.ratingText}>
              {doctor.rating} ({doctor.experience_years || 0} years)
            </Text>
          </View>
        </View>
        {doctor.verified && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        )}
      </View>
      
      <View style={styles.footer}>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.fee}>${doctor.fee || 'N/A'}</Text>
        </View>
        
        <View style={styles.clinicsContainer}>
          <Ionicons name="location-outline" size={16} color={Colors.darkGray} />
          <Text style={styles.clinicsText}>
            {(doctor.clinics?.length || 0)} {(doctor.clinics?.length || 0) === 1 ? 'clinic' : 'clinics'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
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
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  specialty: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
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
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  feeContainer: {
    alignItems: 'flex-start',
  },
  feeLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
    marginBottom: 2,
  },
  fee: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  clinicsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.darkGray,
    marginLeft: Spacing.xs,
  },
});
