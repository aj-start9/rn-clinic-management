import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Typography } from '../constants/theme';

interface AvatarProps {
  name?: string;
  role?: 'consumer' | 'doctor';
  size?: number;
  onPress?: () => void;
  editable?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  role = 'consumer',
  size = 120,
  onPress,
  editable = false,
}) => {
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

  const AvatarContent = (
    <View style={[styles.avatar, avatarStyle]}>
      <Text style={[styles.avatarText, textStyle]}>
        {getInitials(name)}
      </Text>
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
