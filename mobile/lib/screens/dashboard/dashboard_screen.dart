import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiService();
  EquipmentStatistics? _equipStats;
  Map<String, dynamic>? _eventStats;
  FinancialSummary? _finSummary;
  List<ActionLog> _recentLogs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getEquipmentStatistics(),
        _api.getEventStatistics(),
        _api.getFinancialSummary(),
        _api.getActionLogs(take: 5),
      ]);
      if (mounted) {
        setState(() {
          _equipStats = results[0] as EquipmentStatistics;
          _eventStats = results[1] as Map<String, dynamic>;
          _finSummary = results[2] as FinancialSummary;
          _recentLogs = results[3] as List<ActionLog>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back, ${user?.firstName ?? ''}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const Text('Trinity Sound Management', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.of(context).pushNamed('/notifications'),
          ),
        ],
      ),
      body: _isLoading
          ? const LoadingOverlay()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Stats Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.5,
                    children: [
                      StatCard(
                        title: 'Total Equipment',
                        value: '${_equipStats?.totalItems ?? 0}',
                        icon: Icons.inventory_2,
                        iconColor: AppTheme.primary,
                      ),
                      StatCard(
                        title: 'Active Events',
                        value: '${_eventStats?['activeEvents'] ?? _eventStats?['totalEvents'] ?? 0}',
                        icon: Icons.event,
                        iconColor: AppTheme.success,
                      ),
                      StatCard(
                        title: 'Revenue',
                        value: formatCurrency(_finSummary?.totalRevenue ?? 0),
                        icon: Icons.trending_up,
                        iconColor: const Color(0xFF8B5CF6),
                      ),
                      StatCard(
                        title: 'Outstanding',
                        value: formatCurrency(_finSummary?.outstandingAmount ?? 0),
                        icon: Icons.account_balance_wallet,
                        iconColor: AppTheme.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Equipment Status Summary
                  if (_equipStats != null) ...[
                    const Text('Equipment Overview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _statusRow('Available', _equipStats!.totalAvailable, AppTheme.success),
                            _statusRow('Reserved', _equipStats!.totalReserved, const Color(0xFF3B82F6)),
                            _statusRow('In Use', _equipStats!.totalInUse, AppTheme.primary),
                            _statusRow('Damaged', _equipStats!.totalDamaged, AppTheme.error),
                            const Divider(),
                            _statusRow('Inventory Value', null, AppTheme.textPrimary, valueStr: formatCurrency(_equipStats!.totalInventoryValue)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Financial Summary
                  if (_finSummary != null) ...[
                    const Text('Financial Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _finRow('Outstanding Invoices', '${_finSummary!.outstandingCount}', formatCurrency(_finSummary!.outstandingAmount)),
                            _finRow('Overdue Invoices', '${_finSummary!.overdueCount}', formatCurrency(_finSummary!.overdueAmount)),
                            _finRow('Pending Quotes', '${_finSummary!.pendingQuotes}', '-'),
                            _finRow('Accepted Quotes', '${_finSummary!.acceptedQuotesCount}', formatCurrency(_finSummary!.acceptedQuotesValue)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Recent Activity
                  if (_recentLogs.isNotEmpty) ...[
                    const Text('Recent Activity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    Card(
                      child: ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _recentLogs.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final log = _recentLogs[index];
                          return ListTile(
                            dense: true,
                            leading: CircleAvatar(
                              radius: 16,
                              backgroundColor: AppTheme.primary.withOpacity(0.1),
                              child: Text(
                                log.user?.fullName.isNotEmpty == true ? log.user!.initials : '?',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary),
                              ),
                            ),
                            title: Text(log.action, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                            subtitle: Text('${log.entityType} • ${timeAgo(log.createdAt)}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _statusRow(String label, int? count, Color color, {String? valueStr}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
          Text(valueStr ?? '$count', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Widget _finRow(String label, String count, String amount) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
          Text(count, style: const TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(width: 16),
          SizedBox(
            width: 100,
            child: Text(amount, textAlign: TextAlign.right, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
