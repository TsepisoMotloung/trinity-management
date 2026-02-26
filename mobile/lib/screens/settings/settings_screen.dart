import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _api = ApiService();

  void _showEditProfile() {
    final auth = context.read<AuthProvider>();
    final user = auth.user!;
    final firstNameC = TextEditingController(text: user.firstName);
    final lastNameC = TextEditingController(text: user.lastName);
    final phoneC = TextEditingController(text: user.phone ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Edit Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            TextField(controller: firstNameC, decoration: const InputDecoration(labelText: 'First Name')),
            const SizedBox(height: 12),
            TextField(controller: lastNameC, decoration: const InputDecoration(labelText: 'Last Name')),
            const SizedBox(height: 12),
            TextField(controller: phoneC, decoration: const InputDecoration(labelText: 'Phone', prefixText: '+266 ')),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                try {
                  await _api.updateUser(user.id, {
                    'firstName': firstNameC.text,
                    'lastName': lastNameC.text,
                    'phone': phoneC.text.isNotEmpty ? phoneC.text : null,
                  });
                  await auth.refreshUser();
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              },
              child: const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }

  void _showChangePassword() {
    final currentC = TextEditingController();
    final newC = TextEditingController();
    final confirmC = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Change Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            TextField(controller: currentC, obscureText: true, decoration: const InputDecoration(labelText: 'Current Password')),
            const SizedBox(height: 12),
            TextField(controller: newC, obscureText: true, decoration: const InputDecoration(labelText: 'New Password')),
            const SizedBox(height: 12),
            TextField(controller: confirmC, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm New Password')),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                if (newC.text != confirmC.text) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
                  return;
                }
                try {
                  await _api.changePassword(currentC.text, newC.text);
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password changed successfully')));
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              },
              child: const Text('Change Password'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppTheme.primary.withOpacity(0.1),
                    child: Text(user?.initials ?? '?', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 24)),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.fullName ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '', style: const TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 4),
                  StatusBadge(status: user != null ? user.role.name.toUpperCase() : 'STAFF', label: user != null ? user.role.name.toUpperCase() : 'Staff'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Account section
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 8),
            child: Text('Account', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          ),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: const Text('Edit Profile'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: _showEditProfile,
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.lock_outline),
                  title: const Text('Change Password'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: _showChangePassword,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // App section
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 8),
            child: Text('App', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          ),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.menu_book_outlined),
                  title: const Text('Training Guide'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () => Navigator.pushNamed(context, '/training'),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: const Text('Privacy Policy'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () => Navigator.pushNamed(context, '/privacy-policy'),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: const Text('Terms of Service'),
                  trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                  onTap: () => Navigator.pushNamed(context, '/privacy-policy'),
                ),
                const Divider(height: 1, indent: 56),
                const ListTile(
                  leading: Icon(Icons.info_outline),
                  title: Text('Version'),
                  trailing: Text('1.0.0', style: TextStyle(color: AppTheme.textSecondary)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Logout button
          OutlinedButton.icon(
            onPressed: () async {
              await auth.logout();
              Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
            },
            icon: const Icon(Icons.logout, color: AppTheme.error),
            label: const Text('Log Out', style: TextStyle(color: AppTheme.error)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTheme.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
