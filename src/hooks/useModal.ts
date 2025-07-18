import { useState } from 'react';
import { AlertType } from '../components/CustomModal';

interface ModalState {
  isVisible: boolean;
  type: AlertType;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (
    type: AlertType,
    title: string,
    message: string,
    options?: {
      primaryButtonText?: string;
      secondaryButtonText?: string;
      onPrimaryPress?: () => void;
      onSecondaryPress?: () => void;
    }
  ) => {
    setModalState({
      isVisible: true,
      type,
      title,
      message,
      primaryButtonText: options?.primaryButtonText || 'OK',
      secondaryButtonText: options?.secondaryButtonText,
      onPrimaryPress: options?.onPrimaryPress || hideModal,
      onSecondaryPress: options?.onSecondaryPress,
    });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (title: string, message: string, onPress?: () => void) => {
    showModal('success', title, message, { onPrimaryPress: onPress || hideModal });
  };

  const showError = (title: string, message: string, onPress?: () => void) => {
    showModal('error', title, message, { onPrimaryPress: onPress || hideModal });
  };

  const showWarning = (title: string, message: string, onPress?: () => void) => {
    showModal('warning', title, message, { onPrimaryPress: onPress || hideModal });
  };

  const showInfo = (title: string, message: string, onPress?: () => void) => {
    showModal('info', title, message, { onPrimaryPress: onPress || hideModal });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal('warning', title, message, {
      primaryButtonText: 'Confirm',
      secondaryButtonText: 'Cancel',
      onPrimaryPress: () => {
        hideModal();
        onConfirm();
      },
      onSecondaryPress: () => {
        hideModal();
        onCancel?.();
      },
    });
  };

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};
