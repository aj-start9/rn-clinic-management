import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Colors, Shadow, Spacing, Typography } from '../../constants/theme';
import { useNavigation } from '../../hooks/useNavigation';

export const PrivacyPolicyScreen: React.FC = () => {
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

        <Text style={styles.introText}>
          At DocAppointment, we take your privacy seriously. This Privacy Policy explains how we collect, 
          use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        {renderSection('1. Information We Collect', [
          'Personal Information: When you create an account, we collect information such as your name, email address, phone number, date of birth, and address.',
          'Health Information: We may collect limited health-related information necessary for appointment booking, such as reason for visit or medical history summaries.',
          'Usage Information: We collect information about how you use our App, including your interactions, preferences, and settings.',
          'Device Information: We collect information about your mobile device, including device type, operating system, and unique device identifiers.',
          'Location Information: With your consent, we may collect location data to help you find nearby healthcare providers.'
        ])}

        {renderSection('2. How We Use Your Information', [
          'To provide and maintain our appointment booking services',
          'To facilitate communication between you and healthcare providers',
          'To process payments and manage billing',
          'To send you important notifications about your appointments',
          'To improve our App and develop new features',
          'To ensure the security and integrity of our services',
          'To comply with legal obligations and respond to lawful requests'
        ])}

        {renderSection('3. Information Sharing and Disclosure', [
          'Healthcare Providers: We share relevant appointment and contact information with healthcare providers to facilitate your appointments.',
          'Service Providers: We may share information with trusted third-party service providers who assist us in operating our App (payment processors, cloud storage, etc.).',
          'Legal Requirements: We may disclose information when required by law or to protect our rights, property, or safety.',
          'Business Transfers: In case of merger, acquisition, or sale of assets, your information may be transferred to the new entity.',
          'Consent: We may share information with third parties when you give us explicit consent to do so.'
        ])}

        {renderSection('4. Data Security', [
          'We implement industry-standard security measures to protect your information from unauthorized access, use, or disclosure.',
          'All sensitive data is encrypted both in transit and at rest using advanced encryption technologies.',
          'We regularly update our security practices and conduct security audits to ensure the protection of your information.',
          'Access to personal information is restricted to authorized personnel who need it to provide services.',
          'Despite our security measures, no system is 100% secure, and we cannot guarantee absolute security.'
        ])}

        {renderSection('5. Your Privacy Rights', [
          'Access: You have the right to access the personal information we hold about you.',
          'Correction: You can request correction of inaccurate or incomplete information.',
          'Deletion: You may request deletion of your personal information, subject to certain limitations.',
          'Portability: You can request a copy of your personal information in a portable format.',
          'Opt-out: You can opt-out of non-essential communications and data processing activities.',
          'To exercise these rights, please contact our privacy team using the information provided below.'
        ])}

        {renderSection('6. Health Information Privacy (HIPAA)', [
          'We understand the sensitive nature of health information and are committed to protecting your medical privacy.',
          'While we are not directly covered by HIPAA, we follow HIPAA-inspired practices for handling health information.',
          'Healthcare providers using our platform remain responsible for their own HIPAA compliance.',
          'We recommend discussing privacy concerns directly with your healthcare provider.'
        ])}

        {renderSection('7. Children\'s Privacy', [
          'Our App is not intended for children under 13 years of age.',
          'We do not knowingly collect personal information from children under 13.',
          'If you are a parent or guardian and believe your child has provided us with personal information, please contact us.',
          'We will promptly delete any information we discover has been collected from children under 13.'
        ])}

        {renderSection('8. International Data Transfers', [
          'Your information may be transferred to and processed in countries other than your own.',
          'We ensure appropriate safeguards are in place when transferring data internationally.',
          'By using our App, you consent to such transfers in accordance with this Privacy Policy.'
        ])}

        {renderSection('9. Data Retention', [
          'We retain your personal information only as long as necessary to provide our services and fulfill legal obligations.',
          'Account information is typically retained while your account is active and for a reasonable period afterward.',
          'Health-related information may be retained for longer periods as required by healthcare regulations.',
          'You may request deletion of your information, subject to legal and contractual obligations.'
        ])}

        {renderSection('10. Third-Party Links and Services', [
          'Our App may contain links to third-party websites or services.',
          'This Privacy Policy does not apply to third-party sites or services.',
          'We encourage you to review the privacy policies of any third-party sites you visit.',
          'We are not responsible for the privacy practices of third parties.'
        ])}

        {renderSection('11. Changes to This Privacy Policy', [
          'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.',
          'We will notify you of significant changes through the App or via email.',
          'Your continued use of the App after changes are posted constitutes acceptance of the updated Privacy Policy.'
        ])}

        {renderSection('12. Contact Us', [
          'If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:',
          'Email: privacy@docappointment.com',
          'Phone: +1 (234) 567-8900',
          'Address: 123 Healthcare Ave, Medical City, MC 12345',
          'Privacy Officer: privacy@docappointment.com'
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
  introText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    fontStyle: 'italic',
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
