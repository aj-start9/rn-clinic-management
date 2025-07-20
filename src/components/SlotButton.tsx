import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';
import { TimeSlot } from '../types';

interface SlotButtonProps {
  slot: TimeSlot;
  selected: boolean;
  onPress: () => void;
}

export const SlotButton: React.FC<SlotButtonProps> = ({
  slot,
  selected,
  onPress,
}) => {
  const buttonStyle = [
    styles.button,
    selected && styles.selectedButton,
    !slot.available && styles.disabledButton,
  ];

  const textStyle = [
    styles.text,
    selected && styles.selectedText,
    !slot.available && styles.disabledText,
  ];
  console.log('SlotButton rendered', slot, 'selected:', selected, 'available:', slot.available);
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={!slot.available}
      activeOpacity={0.8}
    >
      <Text style={textStyle}>{slot.time}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.lightGray,
  },
  text: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  selectedText: {
    color: Colors.white,
  },
  disabledText: {
    color: Colors.darkGray,
  },
});
