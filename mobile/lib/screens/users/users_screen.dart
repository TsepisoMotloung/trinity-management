import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  final _api = ApiService();
  List<User> _users = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _users = await _api.getUsers(search: _search);
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showUserActions(User user) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                  radius: 24,
                  child: Text(user.initials, style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                      Text(user.email, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            DetailRow(label: 'Role', value: user.role.value),
            DetailRow(label: 'Phone', value: user.phone ?? '-'),
            DetailRow(label: 'Active', value: user.isActive ? 'Yes' : 'No'),
            DetailRow(label: 'Approved', value: user.isApproved ? 'Yes' : 'No'),
            DetailRow(label: 'Last Login', value: user.lastLoginAt != null ? formatDateTime(user.lastLoginAt!) : 'Never'),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (!user.isApproved)
                  ElevatedButton.icon(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await _api.approveUser(user.id);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User approved')));
                    },
                    icon: const Icon(Icons.check, size: 18),
                    label: const Text('Approve'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
                  ),
                if (!user.isApproved)
                  OutlinedButton.icon(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await _api.rejectUser(user.id);
                      _loadData();
                    },
                    icon: const Icon(Icons.close, size: 18),
                    label: const Text('Reject'),
                  ),
                if (user.isActive)
                  OutlinedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await _api.updateUser(user.id, {'isActive': false});
                      _loadData();
                    },
                    child: const Text('Deactivate'),
                  ),
                if (!user.isActive)
                  ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await _api.updateUser(user.id, {'isActive': true});
                      _loadData();
                    },
                    child: const Text('Activate'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search users...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _users.isEmpty
                    ? const EmptyState(icon: Icons.people, title: 'No users found')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _users.length,
                          itemBuilder: (context, index) {
                            final u = _users[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                                  child: Text(u.initials, style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600, fontSize: 12)),
                                ),
                                title: Text(u.fullName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                subtitle: Text(u.email, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    StatusBadge(status: u.role.value, label: u.role.value, fontSize: 10),
                                    const SizedBox(width: 6),
                                    Icon(
                                      u.isApproved ? Icons.verified : Icons.pending,
                                      size: 16,
                                      color: u.isApproved ? AppTheme.success : AppTheme.warning,
                                    ),
                                  ],
                                ),
                                onTap: () => _showUserActions(u),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
