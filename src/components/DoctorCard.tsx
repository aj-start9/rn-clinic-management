import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../constants/theme';
import { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onPress }) => {
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Image source={{ uri: doctor.photo_url }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{doctor.name}</Text>
          <Text style={styles.specialty}>{doctor.specialty}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(doctor.rating)}
            </View>
            <Text style={styles.ratingText}>
              {doctor.rating} ({doctor.experience_years} years)
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
          <Text style={styles.fee}>${doctor.fee}</Text>
        </View>
        
        <View style={styles.clinicsContainer}>
          <Ionicons name="location-outline" size={16} color={Colors.darkGray} />
          <Text style={styles.clinicsText}>
            {doctor.clinics?.length || 0} {doctor.clinics?.length === 1 ? 'clinic' : 'clinics'}
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
    ...Shadow.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
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
