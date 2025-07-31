import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Typography } from '../constants/theme';

interface AvatarProps {
  name?: string;
  role?: 'consumer' | 'doctor';
  size?: number;
  onPress?: () => void;
  editable?: boolean;
  imageUrl?: string;
  avatarRole?: string; // For dummy avatar selection
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  role = 'consumer',
  size = 120,
  onPress,
  editable = false,
  imageUrl,
  avatarRole,
}) => {
  const [imageError, setImageError] = useState(false);

  const getDummyDoctorImage = (avatarId?: string): string => {
    // Generate a consistent dummy image based on avatar role or name
    const seed = avatarId || name || 'default';
    const imageIndex = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 10;
    
    // Using diverse professional headshots from Unsplash for doctors
    const doctorImages = [
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1594824420015-bd81bd6f9fd9?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1563902690319-d0b65ba4df47?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1606721977762-10e49a1a6b6b?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1628348068343-c6a848d2d497?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1609221511881-5b5ad9b4fdd1?w=300&h=300&fit=crop&crop=face'
    ];
    
    return doctorImages[imageIndex % doctorImages.length];
  };

  const getDummyConsumerImage = (avatarId?: string): string => {
    // Generate a consistent dummy image based on avatar role or name
    const seed = avatarId || name || 'user';
    const imageIndex = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 10;
    
    // Using diverse casual/friendly headshots from Unsplash for consumers
    const consumerImages = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616c2e9ba83?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1557862921-37829c790f19?w=300&h=300&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face'
    ];
    
    return consumerImages[imageIndex % consumerImages.length];
  };

  const getImageSource = (): string => {
    if (imageUrl && !imageError) {
      return imageUrl;
    }
    
    // If avatarRole is provided, use it for dummy image generation
    if (avatarRole) {
      if (role === 'doctor') {
        return getDummyDoctorImage(avatarRole);
      }
      if (role === 'consumer') {
        return getDummyConsumerImage(avatarRole);
      }
    }
    
    // Fallback to role-based dummy images
    if (role === 'doctor') {
      return getDummyDoctorImage();
    }
    
    if (role === 'consumer') {
      return getDummyConsumerImage();
    }
    
    // Final fallback to initials-based avatar
    const seed = name || 'user';
    return `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=random`;
  };
  const getInitials = (fullName?: string): string => {
    if (!fullName) return 'U';
    const words = fullName.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getBackgroundColor = (): string => {
    switch (role) {
      case 'doctor':
        return Colors.primary; // Teal/Primary color for doctors
      case 'consumer':
        return Colors.darkGray; // Gray color for consumers
      default:
        return Colors.darkGray;
    }
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: getBackgroundColor(),
  };

  const textStyle = {
    fontSize: size * 0.35, // Proportional font size
    color: Colors.white,
    fontWeight: Typography.weights.bold as any,
  };

  const shouldShowImage = (imageUrl || role === 'doctor' || role === 'consumer') && !imageError;
  console.log('ImagshouldShowImageshouldShowImagee URL:', imageUrl);
  const AvatarContent = (
    <View style={[styles.avatar, avatarStyle]}>
      {shouldShowImage ? (
        <Image
          source={{ uri: getImageSource() }}
          style={[styles.avatarImage, avatarStyle]}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.avatarText, textStyle]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.container}>
        {AvatarContent}
        {editable && (
          <View style={[styles.editButton, { width: size * 0.3, height: size * 0.3, right: size * 0.05, bottom: size * 0.05 }]}>
            <Text style={styles.editIcon}>✎</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {AvatarContent}
      {editable && (
        <View style={[styles.editButton, { width: size * 0.3, height: size * 0.3, right: size * 0.05, bottom: size * 0.05 }]}>
          <Text style={styles.editIcon}>✎</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    borderRadius: BorderRadius.full,
  },
  avatarText: {
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editIcon: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
