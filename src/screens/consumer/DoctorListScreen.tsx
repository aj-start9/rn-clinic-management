import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { DoctorCard } from '../../components/DoctorCard';
import { SearchBar } from '../../components/SearchBar';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';
import { clearFilters, fetchDoctors, setFilters, setSearchQuery } from '../../redux/doctorSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchSpecialties } from '../../redux/specialtySlice';
import { Doctor } from '../../types';
import { TabParamList } from '../../types/navigation';

type DoctorListRouteProp = RouteProp<TabParamList, 'Doctors'>;

export const DoctorListScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DoctorListRouteProp>();
  const dispatch = useAppDispatch();
  const { doctors, loading, searchQuery, filters } = useAppSelector((state) => state.doctors);
  const { specialties } = useAppSelector((state) => state.specialties);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  console.log('DoctorListScreen - filters:', filters);
  useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(fetchSpecialties());
    
    // Set initial specialty filter if passed from navigation
    if (route.params?.specialty) {
      dispatch(setFilters({ specialty_id: route.params.specialty }));
    }

    // Cleanup function - runs when component unmounts
    return () => {
      dispatch(clearFilters());
      dispatch(setSearchQuery(''));
    };
  }, [dispatch, route.params?.specialty]);

  const filteredDoctors = doctors.filter((doctor: Doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.specialty_id.toLowerCase() === (searchQuery.toLowerCase()));

    // More flexible specialty matching - check if doctor specialty contains the filter or vice versa
    const matchesSpecialty = !filters.specialty_id ||
      doctor.specialty_id === filters.specialty_id ||
      doctor.specialty_id.toLowerCase().includes(filters.specialty_id.toLowerCase()) ||
      filters.specialty_id.toLowerCase().includes(doctor.specialty_id.toLowerCase());
    const matchesRating = !filters.rating || doctor.rating >= filters.rating;
    const matchesExperience = !filters.experience || doctor.experience_years >= filters.experience;

    return matchesSearch && matchesSpecialty && matchesRating && matchesExperience;
  });

  const handleSearch = (text: string) => {
    dispatch(setSearchQuery(text));
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(tempFilters));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = { specialty_id: '', rating: 0, experience: 0 };
    setTempFilters(clearedFilters);
    dispatch(clearFilters());
    setShowFilters(false);
  };

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <DoctorCard
      doctor={item}
      onPress={() => navigation.navigate('DoctorDetail', { doctorId: item.id })}
    />
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Specialty</Text>
          <View style={styles.specialtyGrid}>
            {specialties.map((specialtyObj) => (
              <TouchableOpacity
                key={specialtyObj.id}
                style={[
                  styles.specialtyChip,
                  tempFilters.specialty_id === specialtyObj.id && styles.specialtyChipSelected,
                ]}
                onPress={() =>
                  setTempFilters(prev => ({
                    ...prev,
                    specialty_id: prev.specialty_id === specialtyObj.id ? '' : specialtyObj.id,
                  }))
                }
              >
                <Text
                  style={[
                    styles.specialtyChipText,
                    tempFilters.specialty_id === specialtyObj.id && styles.specialtyChipTextSelected,
                  ]}
                >
                  {specialtyObj.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Minimum Rating</Text>
          <View style={styles.ratingOptions}>
            {[4.0, 4.5, 4.8].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingChip,
                  tempFilters.rating === rating && styles.ratingChipSelected,
                ]}
                onPress={() =>
                  setTempFilters(prev => ({
                    ...prev,
                    rating: prev.rating === rating ? 0 : rating,
                  }))
                }
              >
                <Text
                  style={[
                    styles.ratingChipText,
                    tempFilters.rating === rating && styles.ratingChipTextSelected,
                  ]}
                >
                  {rating}+ ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Experience</Text>
          <View style={styles.experienceOptions}>
            {[1, 3, 5].map((years) => (
              <TouchableOpacity
                key={years}
                style={[
                  styles.experienceChip,
                  tempFilters.experience === years && styles.experienceChipSelected,
                ]}
                onPress={() =>
                  setTempFilters(prev => ({
                    ...prev,
                    experience: prev.experience === years ? 0 : years,
                  }))
                }
              >
                <Text
                  style={[
                    styles.experienceChipText,
                    tempFilters.experience === years && styles.experienceChipTextSelected,
                  ]}
                >
                  {years}+ years
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.modalActions}>
          <Button
            title="Clear All"
            onPress={handleClearFilters}
            variant="outline"
            style={styles.modalButton}
          />
          <Button
            title="Apply Filters"
            onPress={handleApplyFilters}
            style={styles.modalButton}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          onFilterPress={() => setShowFilters(true)}
        />
      </View>

      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchDoctors())}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={Colors.darkGray} />
            <Text style={styles.emptyText}>No doctors found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },
  listContainer: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  specialtyChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  specialtyChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  specialtyChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
  },
  specialtyChipTextSelected: {
    color: Colors.white,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  ratingChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ratingChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
  },
  ratingChipTextSelected: {
    color: Colors.white,
  },
  experienceOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  experienceChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  experienceChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  experienceChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
  },
  experienceChipTextSelected: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
    paddingBottom: Spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
