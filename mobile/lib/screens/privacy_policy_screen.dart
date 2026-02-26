import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Privacy Policy',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last updated: ${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().day.toString().padLeft(2, '0')}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
            const SizedBox(height: 24),
            _buildSection(
              context,
              'Introduction',
              'Trinity Sound ("we", "us", or "our") operates the Trinity Sound mobile application '
                  '(the "App"). This Privacy Policy informs you of our policies regarding the collection, '
                  'use, and disclosure of personal information when you use our App.\n\n'
                  'By using the App, you agree to the collection and use of information in accordance '
                  'with this policy.',
            ),
            _buildSection(
              context,
              'Information We Collect',
              'We collect the following types of information:\n\n'
                  '• Account Information: Name, email address, phone number, and role within the '
                  'organization when you create or manage an account.\n\n'
                  '• Client Data: Client names, contact details, and addresses that you enter for '
                  'business management purposes.\n\n'
                  '• Event & Booking Data: Event details, dates, locations, and equipment assignments '
                  'that you create through the App.\n\n'
                  '• Financial Data: Invoice amounts, payment records, and transaction details '
                  'entered for business accounting.\n\n'
                  '• Equipment Data: Equipment inventory details, maintenance records, and status '
                  'information.\n\n'
                  '• Usage Data: We may collect information about how you access and use the App, '
                  'including device type, operating system, and app interaction patterns.',
            ),
            _buildSection(
              context,
              'How We Use Your Information',
              'We use the collected information for the following purposes:\n\n'
                  '• To provide and maintain the App\n'
                  '• To manage your account and provide customer support\n'
                  '• To manage business operations including events, equipment, and finances\n'
                  '• To send notifications about events, equipment status, and account activity\n'
                  '• To detect, prevent, and address technical issues\n'
                  '• To improve and optimize the App experience',
            ),
            _buildSection(
              context,
              'Data Storage & Security',
              'Your data is stored on secure servers and transmitted using industry-standard '
                  'encryption (HTTPS/TLS). We implement appropriate technical and organizational '
                  'measures to protect your personal information against unauthorized access, '
                  'alteration, disclosure, or destruction.\n\n'
                  'Authentication tokens are stored securely on your device using encrypted storage. '
                  'We do not store passwords in plain text.',
            ),
            _buildSection(
              context,
              'Data Sharing',
              'We do not sell, trade, or rent your personal information to third parties. '
                  'We may share your information only in the following circumstances:\n\n'
                  '• With your organization\'s administrators as part of business operations\n'
                  '• When required by law or to respond to legal process\n'
                  '• To protect our rights, privacy, safety, or property\n'
                  '• In connection with a merger, acquisition, or sale of assets (with prior notice)',
            ),
            _buildSection(
              context,
              'Data Retention',
              'We retain your personal information for as long as your account is active or as '
                  'needed to provide you services. We will retain and use your information as necessary '
                  'to comply with our legal obligations, resolve disputes, and enforce our agreements.\n\n'
                  'You may request deletion of your account and associated data by contacting your '
                  'organization administrator or our support team.',
            ),
            _buildSection(
              context,
              'Your Rights',
              'You have the right to:\n\n'
                  '• Access the personal information we hold about you\n'
                  '• Request correction of inaccurate data\n'
                  '• Request deletion of your data\n'
                  '• Object to processing of your data\n'
                  '• Request data portability\n'
                  '• Withdraw consent at any time\n\n'
                  'To exercise these rights, please contact your organization administrator or '
                  'reach out to us using the contact information below.',
            ),
            _buildSection(
              context,
              'Children\'s Privacy',
              'Our App is not intended for use by children under the age of 13. We do not '
                  'knowingly collect personal information from children under 13. If we discover '
                  'that a child under 13 has provided us with personal information, we will delete '
                  'it immediately.',
            ),
            _buildSection(
              context,
              'Changes to This Policy',
              'We may update our Privacy Policy from time to time. We will notify you of any '
                  'changes by posting the new Privacy Policy in the App and updating the "Last updated" '
                  'date. You are advised to review this Privacy Policy periodically for any changes.',
            ),
            _buildSection(
              context,
              'Contact Us',
              'If you have any questions about this Privacy Policy, please contact us:\n\n'
                  '• Email: privacy@trinitysound.co.ls\n'
                  '• Phone: +266 2231 0000\n'
                  '• Address: Trinity Sound, Maseru, Lesotho',
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }
}
