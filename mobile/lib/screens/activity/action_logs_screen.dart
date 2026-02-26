import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class ActionLogsScreen extends StatefulWidget {
  const ActionLogsScreen({super.key});

  @override
  State<ActionLogsScreen> createState() => _ActionLogsScreenState();
}

class _ActionLogsScreenState extends State<ActionLogsScreen> {
  final _api = ApiService();
  List<ActionLog> _logs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _logs = await _api.getActionLogs();
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  IconData _actionIcon(String action) {
    final a = action.toLowerCase();
    if (a.contains('create')) return Icons.add_circle_outline;
    if (a.contains('update') || a.contains('edit')) return Icons.edit;
    if (a.contains('delete')) return Icons.delete_outline;
    if (a.contains('approve')) return Icons.check_circle_outline;
    if (a.contains('login')) return Icons.login;
    if (a.contains('checkout') || a.contains('check_out')) return Icons.output;
    if (a.contains('checkin') || a.contains('check_in')) return Icons.input;
    return Icons.history;
  }

  Color _actionColor(String action) {
    final a = action.toLowerCase();
    if (a.contains('create')) return AppTheme.success;
    if (a.contains('delete')) return AppTheme.error;
    if (a.contains('approve')) return AppTheme.success;
    return AppTheme.primary;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Activity Log')),
      body: _isLoading
          ? const LoadingOverlay()
          : _logs.isEmpty
              ? const EmptyState(icon: Icons.history, title: 'No activity yet')
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _logs.length,
                    itemBuilder: (context, index) {
                      final log = _logs[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 6),
                        child: ListTile(
                          dense: true,
                          leading: CircleAvatar(
                            radius: 16,
                            backgroundColor: _actionColor(log.action).withOpacity(0.1),
                            child: Icon(_actionIcon(log.action), size: 16, color: _actionColor(log.action)),
                          ),
                          title: Text(
                            log.action.replaceAll('_', ' '),
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (log.details != null && log.details!.isNotEmpty)
                                Text(log.details.toString(), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                              Text(
                                '${log.user?.fullName ?? 'System'} • ${timeAgo(log.createdAt)}',
                                style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                          trailing: Text(log.entityType, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
