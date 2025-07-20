import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';

export const TermsScreen: React.FC = () => {
  const navigation = useNavigation();

  const renderSection = (title: string, content: string[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {content.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: July 21, 2025</Text>

        {renderSection('1. Acceptance of Terms', [
          'By downloading, accessing, or using the DocAppointment mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our App.',
          'These Terms constitute a legally binding agreement between you and DocAppointment regarding your use of the App and services provided through it.'
        ])}

        {renderSection('2. Description of Service', [
          'DocAppointment is a mobile application that facilitates appointment booking between patients and healthcare providers. Our service allows users to:',
          '• Search and browse healthcare providers',
          '• Book, reschedule, and cancel medical appointments',
          '• Manage appointment history and preferences',
          '• Communicate with healthcare providers through the platform'
        ])}

        {renderSection('3. User Accounts and Registration', [
          'To use certain features of the App, you must create an account and provide accurate, current, and complete information.',
          'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
          'You must notify us immediately of any unauthorized use of your account or any other breach of security.',
          'We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activities.'
        ])}

        {renderSection('4. Appointment Booking and Cancellation', [
          'Appointments are subject to healthcare provider availability and confirmation.',
          'You may cancel or reschedule appointments according to the cancellation policy of the respective healthcare provider.',
          'Late cancellations (typically less than 24 hours) may result in cancellation fees as determined by the healthcare provider.',
          'No-shows may be charged the full appointment fee at the discretion of the healthcare provider.'
        ])}

        {renderSection('5. Payment Terms', [
          'Payment for services is processed through secure third-party payment processors.',
          'You agree to pay all fees and charges associated with your appointments.',
          'All payments are final unless otherwise specified by the healthcare provider\'s refund policy.',
          'We reserve the right to modify our fee structure with 30 days notice.'
        ])}

        {renderSection('6. User Conduct', [
          'You agree not to use the App for any unlawful purpose or in any way that could damage, disable, or impair the service.',
          'You must not attempt to gain unauthorized access to any part of the App or its related systems.',
          'Harassment, abuse, or inappropriate behavior toward healthcare providers or other users is strictly prohibited.',
          'You must provide accurate and truthful information when booking appointments.'
        ])}

        {renderSection('7. Healthcare Provider Responsibilities', [
          'Healthcare providers are independent contractors and are solely responsible for the medical services they provide.',
          'DocAppointment does not practice medicine or provide medical advice.',
          'We are not responsible for the quality, safety, or legality of services provided by healthcare providers on our platform.',
          'Any disputes regarding medical services should be resolved directly with the healthcare provider.'
        ])}

        {renderSection('8. Privacy and Data Protection', [
          'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.',
          'We implement appropriate security measures to protect your personal and medical information.',
          'You consent to the collection and use of your information as described in our Privacy Policy.'
        ])}

        {renderSection('9. Limitation of Liability', [
          'DocAppointment shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.',
          'Our total liability shall not exceed the amount of fees paid by you for the services in question.',
          'We are not responsible for any medical malpractice, negligence, or other professional misconduct by healthcare providers.'
        ])}

        {renderSection('10. Modifications to Terms', [
          'We reserve the right to modify these Terms at any time.',
          'Changes will be posted in the App and will become effective immediately upon posting.',
          'Your continued use of the App after changes are posted constitutes acceptance of the modified Terms.'
        ])}

        {renderSection('11. Termination', [
          'You may terminate your account at any time by contacting our support team.',
          'We may suspend or terminate your access to the App for violation of these Terms or for any other reason at our sole discretion.',
          'Upon termination, your right to use the App will cease immediately.'
        ])}

        {renderSection('12. Contact Information', [
          'If you have any questions about these Terms, please contact us at:',
          'Email: legal@docappointment.com',
          'Phone: +1 (234) 567-8900',
          'Address: 123 Healthcare Ave, Medical City, MC 12345'
        ])}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 20, // Adjust for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  lastUpdated: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  paragraph: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
    textAlign: 'justify',
  },
});
