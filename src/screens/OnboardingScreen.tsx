import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    PanResponder,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingPage {
  id: number;
  title: string;
  subtitle: string;
  backgroundColor: string;
  icon: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const rotateAnimation = useSharedValue(0);
  
  const pages: OnboardingPage[] = [
    {
      id: 0,
      title: 'Welcome to DocCare',
      subtitle: 'Your trusted healthcare companion for booking appointments with certified doctors anytime, anywhere.',
      backgroundColor: Colors.primary,
      icon: 'medical',
    },
    {
      id: 1,
      title: 'Easy Scheduling',
      subtitle: 'Book appointments with your favorite doctors in just a few taps. Choose your preferred time and get instant confirmation.',
      backgroundColor: Colors.primary,
      icon: 'calendar',
    },
    {
      id: 2,
      title: 'Trusted Doctors',
      subtitle: 'Connect with verified healthcare professionals. Read reviews, check availability, and find the perfect doctor for your needs.',
      backgroundColor: Colors.success,
      icon: 'people',
    },
    {
      id: 3,
      title: 'Stay Updated',
      subtitle: 'Get real-time notifications about your appointments, doctor availability, and health reminders.',
      backgroundColor: Colors.accent,
      icon: 'notifications',
    },
  ];
  
  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 800 });
    
    // Start pulse animation
    pulseAnimation.value = withRepeat(
      withTiming(1.2, { duration: 1500 }),
      -1,
      true
    );
    
    // Start rotation animation
    rotateAnimation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnimation.value }],
      opacity: interpolate(pulseAnimation.value, [1, 1.2], [0.6, 0.2], Extrapolate.CLAMP),
    };
  });

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateAnimation.value}deg` }],
    };
  });

  const handleDotPress = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    scrollRef.current?.scrollTo({ x: pageIndex * width, animated: true });
  };

  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      onComplete();
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollRef.current?.scrollTo({ x: nextPage * width, animated: true });
    } else {
      handleDone();
    }
  };

  const handleSkip = () => {
    handleDone();
  };

  const handleScroll = (event: any) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(pageIndex);
  };

  // Enhanced gesture handling for better swipe detection
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      // Could add haptic feedback here if desired
    },
    onPanResponderRelease: (evt, gestureState) => {
      const swipeThreshold = 50;
      if (gestureState.dx > swipeThreshold && currentPage > 0) {
        // Swipe right - go to previous page
        const prevPage = currentPage - 1;
        setCurrentPage(prevPage);
        scrollRef.current?.scrollTo({ x: prevPage * width, animated: true });
      } else if (gestureState.dx < -swipeThreshold && currentPage < pages.length - 1) {
        // Swipe left - go to next page
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        scrollRef.current?.scrollTo({ x: nextPage * width, animated: true });
      }
    },
  });

  const renderPage = (page: OnboardingPage, index: number) => (
    <View key={page.id} style={[styles.page, { backgroundColor: page.backgroundColor }]}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <View style={styles.iconWrapper}>
          <Ionicons name={page.icon as any} size={80} color={Colors.white} />
          
          {/* Animated elements for each page */}
          {index === 0 && (
            <>
              <Animated.View style={[styles.pulseCircle, pulseStyle]} />
              <Animated.View style={[styles.pulseCircle, styles.pulseCircle2, pulseStyle]} />
            </>
          )}
          
          {index === 1 && (
            <View style={styles.floatingElement}>
              <Ionicons name="time" size={24} color={Colors.primary} />
            </View>
          )}
          
          {index === 2 && (
            <Animated.View style={[styles.rotatingElement, rotateStyle]}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.white} />
            </Animated.View>
          )}
          
          {index === 3 && (
            <View style={styles.bounceElement}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
            </View>
          )}
        </View>
      </Animated.View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </View>

      {/* Bottom navigation - now inside each page */}
      <View style={styles.bottomContainer}>
        {/* Page indicators */}
        <View style={styles.pagination}>
          {pages.map((_, pageIndex) => (
            <TouchableOpacity
              key={pageIndex}
              onPress={() => handleDotPress(pageIndex)}
              style={[
                styles.dot,
                {
                  backgroundColor: pageIndex === currentPage ? Colors.white : 'rgba(255, 255, 255, 0.4)',
                  transform: [{ scale: pageIndex === currentPage ? 1.2 : 1 }],
                }
              ]}
            />
          ))}
        </View>
        
        {/* Navigation buttons */}
        <View style={styles.navigation}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            {currentPage === pages.length - 1 ? (
              <Ionicons name="checkmark" size={20} color={Colors.primary} />
            ) : (
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={pages[currentPage].backgroundColor} />
      
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {pages.map((page, index) => renderPage(page, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width,
    height,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.35,
    width: width,
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    padding: 8, // Increase touch area
  },
  navigation: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: Typography.sizes.md,
    color: Colors.white,
    fontWeight: Typography.weights.medium,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pulseCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pulseCircle2: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  floatingElement: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rotatingElement: {
    position: 'absolute',
    bottom: -5,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bounceElement: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
