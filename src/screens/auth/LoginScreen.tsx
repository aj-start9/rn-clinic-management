import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { CustomModal } from '../../components/CustomModal';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';
import { useModal } from '../../hooks/useModal';
import { signInUser, signUpUser } from '../../redux/authSlice.supabase';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

export const LoginScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'consumer' | 'doctor'>('consumer');
  
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const navigation = useNavigation();
  const { modalState, showError, showSuccess, hideModal } = useModal();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      showError('Error', 'Please enter your full name');
      return;
    }

    try {
      if (isSignUp) {
        await dispatch(signUpUser({ email, password, role, fullName })).unwrap();
        showSuccess('Success', 'Account created successfully! Please check your email for verification.');
      } else {
        await dispatch(signInUser({ email, password })).unwrap();
      }
    } catch (err: any) {
      showError('Error', err.message || 'Authentication failed');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp 
              ? 'Sign up to book your appointments' 
              : 'Sign in to your account'
            }
          </Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.darkGray}
                />
              </View>

              <View style={styles.roleContainer}>
                <Text style={styles.label}>I am a:</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'consumer' && styles.roleButtonSelected,
                    ]}
                    onPress={() => setRole('consumer')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'consumer' && styles.roleButtonTextSelected,
                      ]}
                    >
                      Patient
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'doctor' && styles.roleButtonSelected,
                    ]}
                    onPress={() => setRole('doctor')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'doctor' && styles.roleButtonTextSelected,
                      ]}
                    >
                      Doctor
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            title={isSignUp ? 'Sign Up' : 'Sign In'}
            onPress={handleAuth}
            loading={loading}
            style={styles.authButton}
          />

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText={modalState.primaryButtonText}
        secondaryButtonText={modalState.secondaryButtonText}
        onPrimaryPress={modalState.onPrimaryPress || hideModal}
        onSecondaryPress={modalState.onSecondaryPress}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  roleContainer: {
    marginBottom: Spacing.lg,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  roleButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
  },
  roleButtonTextSelected: {
    color: Colors.white,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  authButton: {
    marginBottom: Spacing.lg,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
});
