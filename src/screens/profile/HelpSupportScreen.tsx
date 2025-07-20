import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@docappointment.com?subject=Support Request');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/1234567890?text=Hi, I need help with the appointment app');
  };

  const renderContactCard = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    color: string = Colors.primary
  ) => (
    <TouchableOpacity style={styles.contactCard} onPress={onPress}>
      <View style={[styles.contactIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.darkGray} />
    </TouchableOpacity>
  );

  const renderFAQItem = (question: string, answer: string) => (
    <View style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Text style={styles.faqAnswer}>{answer}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <View style={styles.card}>
          {renderContactCard(
            'mail',
            'Email Support',
            'support@docappointment.com',
            handleEmailSupport
          )}
          {renderContactCard(
            'call',
            'Call Us',
            '+1 (234) 567-8900',
            handleCallSupport,
            Colors.success
          )}
          {renderContactCard(
            'logo-whatsapp',
            'WhatsApp',
            'Quick chat support',
            handleWhatsApp,
            '#25D366'
          )}
        </View>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {renderFAQItem(
            'How do I book an appointment?',
            'Navigate to the Doctors tab, search for a doctor by specialty or name, select your preferred doctor, choose an available time slot, and confirm your booking.'
          )}
          {renderFAQItem(
            'Can I reschedule my appointment?',
            'Yes, you can reschedule your appointment up to 2 hours before the scheduled time. Go to your Appointments tab and select the appointment you want to reschedule.'
          )}
          {renderFAQItem(
            'How do I cancel an appointment?',
            'You can cancel your appointment from the Appointments tab. Please note that cancellations made less than 24 hours in advance may be subject to a cancellation fee.'
          )}
          {renderFAQItem(
            'What payment methods do you accept?',
            'We accept all major credit cards, debit cards, and digital wallets. Payment is processed securely after your consultation.'
          )}
          {renderFAQItem(
            'How do I update my profile information?',
            'Go to the Profile tab and tap on "Edit Profile" to update your personal information, contact details, and preferences.'
          )}
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>July 2025</Text>
          </View>
        </View>
      </View>

      {/* Additional Help */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need More Help?</Text>
        <View style={styles.card}>
          <Text style={styles.helpText}>
            If you can't find the answer you're looking for, our support team is here to help. 
            Contact us using any of the methods above, and we'll get back to you as soon as possible.
          </Text>
          <Text style={styles.helpText}>
            Our support hours are Monday to Friday, 9:00 AM to 6:00 PM.
          </Text>
        </View>
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  contactSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  faqItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  faqQuestion: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  faqAnswer: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
  },
  infoValue: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  helpText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
});
