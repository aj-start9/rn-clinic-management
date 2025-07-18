import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomModalProps {
  isVisible: boolean;
  type: AlertType;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onBackdropPress?: () => void;
}

const getIconAndColor = (type: AlertType) => {
  switch (type) {
    case 'success':
      return { icon: 'check-circle', color: Colors.success };
    case 'error':
      return { icon: 'error', color: Colors.error };
    case 'warning':
      return { icon: 'warning', color: Colors.warning };
    case 'info':
      return { icon: 'info', color: Colors.primary };
    default:
      return { icon: 'info', color: Colors.primary };
  }
};

export const CustomModal: React.FC<CustomModalProps> = ({
  isVisible,
  type,
  title,
  message,
  primaryButtonText = 'OK',
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onBackdropPress,
}) => {
  const { icon, color } = getIconAndColor(type);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onBackdropPress || onPrimaryPress}
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={300}
      animationOutTiming={300}
      backdropTransitionInTiming={300}
      backdropTransitionOutTiming={300}
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Icon name={icon} size={40} color={color} />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.buttonContainer}>
          {secondaryButtonText && onSecondaryPress && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onSecondaryPress}
            >
              <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: color }]}
            onPress={onPrimaryPress}
          >
            <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    maxWidth: 340,
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.text.primary,
  },
});
