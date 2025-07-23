import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const ProfileStatsSkeleton: React.FC = () => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <SkeletonLoader width={40} height={24} style={styles.statNumber} />
        <SkeletonLoader width={60} height={16} style={styles.statLabel} />
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <SkeletonLoader width={40} height={24} style={styles.statNumber} />
        <SkeletonLoader width={60} height={16} style={styles.statLabel} />
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <SkeletonLoader width={40} height={24} style={styles.statNumber} />
        <SkeletonLoader width={60} height={16} style={styles.statLabel} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.lightGray,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  statNumber: {
    marginBottom: Spacing.xs,
  },
  statLabel: {
    marginTop: Spacing.xs,
  },
});
