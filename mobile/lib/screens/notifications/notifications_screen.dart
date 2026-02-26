import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = ApiService();
  List<AppNotification> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      _notifications = await _api.getNotifications();
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  IconData _icon(String type) {
    switch (type.toLowerCase()) {
      case 'event':
        return Icons.event;
      case 'equipment':
        return Icons.speaker;
      case 'payment':
      case 'invoice':
        return Icons.receipt_long;
      case 'maintenance':
        return Icons.build;
      case 'user':
        return Icons.person;
      default:
        return Icons.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await _api.markAllNotificationsRead();
              _loadData();
            },
            child: const Text('Mark all read', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
      body: _isLoading
          ? const LoadingOverlay()
          : _notifications.isEmpty
              ? const EmptyState(icon: Icons.notifications_off, title: 'No notifications')
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final n = _notifications[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        color: n.isRead ? null : AppTheme.primary.withOpacity(0.04),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: n.isRead ? BorderSide.none : BorderSide(color: AppTheme.primary.withOpacity(0.2)),
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppTheme.primary.withOpacity(0.1),
                            child: Icon(_icon(n.type), size: 20, color: AppTheme.primary),
                          ),
                          title: Text(n.title, style: TextStyle(fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w600, fontSize: 14)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (n.message.isNotEmpty) Text(n.message, style: const TextStyle(fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Text(timeAgo(n.createdAt), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                            ],
                          ),
                          trailing: n.isRead
                              ? null
                              : GestureDetector(
                                  onTap: () async {
                                    await _api.markNotificationRead(n.id);
                                    _loadData();
                                  },
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.primary),
                                  ),
                                ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
