import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  final _api = ApiService();
  List<MaintenanceTicket> _tickets = [];
  List<EquipmentItem> _equipment = [];
  List<User> _users = [];
  bool _isLoading = true;
  String _search = '';
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getMaintenanceTickets(search: _search, status: _statusFilter),
        _api.getEquipmentItems(take: 200),
        _api.getUsers(take: 100),
      ]);
      if (mounted) {
        setState(() {
          _tickets = results[0] as List<MaintenanceTicket>;
          _equipment = results[1] as List<EquipmentItem>;
          _users = results[2] as List<User>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    final titleC = TextEditingController();
    final issueC = TextEditingController();
    String? selectedEquipmentId;
    MaintenancePriority priority = MaintenancePriority.medium;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('New Maintenance Request', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  value: selectedEquipmentId,
                  decoration: const InputDecoration(labelText: 'Equipment *'),
                  items: _equipment.map((e) => DropdownMenuItem(
                    value: e.id,
                    child: Text('${e.name}${e.serialNumber != null ? ' (${e.serialNumber})' : ''}', overflow: TextOverflow.ellipsis),
                  )).toList(),
                  onChanged: (v) => setSheetState(() => selectedEquipmentId = v),
                  isExpanded: true,
                ),
                const SizedBox(height: 12),
                TextFormField(controller: titleC, decoration: const InputDecoration(labelText: 'Title *')),
                const SizedBox(height: 12),
                TextFormField(controller: issueC, maxLines: 3, decoration: const InputDecoration(labelText: 'Reported Issue *')),
                const SizedBox(height: 12),
                DropdownButtonFormField<MaintenancePriority>(
                  value: priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: MaintenancePriority.values.map((p) => DropdownMenuItem(value: p, child: Text(p.label))).toList(),
                  onChanged: (v) => setSheetState(() => priority = v ?? MaintenancePriority.medium),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (selectedEquipmentId == null || titleC.text.isEmpty || issueC.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fill all required fields')));
                      return;
                    }
                    try {
                      await _api.createMaintenanceTicket({
                        'equipmentId': selectedEquipmentId,
                        'title': titleC.text,
                        'reportedIssue': issueC.text,
                        'priority': priority.value,
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maintenance request created')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: const Text('Create Request'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showTicketActions(MaintenanceTicket ticket) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(ticket.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            Text('${ticket.equipment?.name ?? ''} • ${ticket.priority.label}', style: const TextStyle(color: AppTheme.textSecondary)),
            const Divider(height: 24),
            DetailRow(label: 'Status', value: ticket.status.label, trailing: StatusBadge(status: ticket.status.value, label: ticket.status.label)),
            DetailRow(label: 'Issue', value: ticket.reportedIssue),
            if (ticket.assignedTo != null) DetailRow(label: 'Assigned', value: ticket.assignedTo!.fullName),
            DetailRow(label: 'Created', value: formatDate(ticket.createdAt)),
            const SizedBox(height: 16),
            if (ticket.status != MaintenanceStatus.completed) ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (ticket.status == MaintenanceStatus.open)
                    OutlinedButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _api.updateMaintenanceStatus(ticket.id, 'IN_PROGRESS');
                        _loadData();
                      },
                      child: const Text('Start'),
                    ),
                  OutlinedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await _api.completeMaintenance(ticket.id);
                      _loadData();
                    },
                    child: const Text('Complete'),
                  ),
                  if (ticket.assignedToId == null)
                    OutlinedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _showAssignDialog(ticket);
                      },
                      child: const Text('Assign'),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            TextButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await _api.deleteMaintenance(ticket.id);
                _loadData();
              },
              child: const Text('Delete', style: TextStyle(color: AppTheme.error)),
            ),
          ],
        ),
      ),
    );
  }

  void _showAssignDialog(MaintenanceTicket ticket) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Assign To', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ..._users.map((u) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.primary.withOpacity(0.1),
                    child: Text(u.initials, style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                  title: Text(u.fullName),
                  subtitle: Text(u.role.value, style: const TextStyle(fontSize: 12)),
                  onTap: () async {
                    Navigator.pop(ctx);
                    await _api.assignMaintenance(ticket.id, u.id);
                    _loadData();
                  },
                )),
          ],
        ),
      ),
    );
  }

  Color _priorityColor(MaintenancePriority p) {
    switch (p) {
      case MaintenancePriority.low: return AppTheme.success;
      case MaintenancePriority.medium: return AppTheme.warning;
      case MaintenancePriority.high: return const Color(0xFFF97316);
      case MaintenancePriority.critical: return AppTheme.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Maintenance')),
      floatingActionButton: FloatingActionButton(onPressed: _showCreateDialog, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search tickets...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          FilterChipRow(
            options: const ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED'],
            selected: _statusFilter,
            onSelected: (v) { _statusFilter = v; _loadData(); },
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _tickets.isEmpty
                    ? const EmptyState(icon: Icons.build, title: 'No maintenance tickets')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _tickets.length,
                          itemBuilder: (context, index) {
                            final t = _tickets[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                leading: Container(
                                  width: 42, height: 42,
                                  decoration: BoxDecoration(
                                    color: _priorityColor(t.priority).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(Icons.build, color: _priorityColor(t.priority), size: 20),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(child: Text(t.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                                    StatusBadge(status: t.status.value, label: t.status.label),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(t.equipment?.name ?? '-', style: const TextStyle(fontSize: 12)),
                                    Row(
                                      children: [
                                        StatusBadge(status: t.priority.value, label: t.priority.label, fontSize: 10),
                                        const SizedBox(width: 8),
                                        if (t.assignedTo != null) Text('→ ${t.assignedTo!.fullName}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                      ],
                                    ),
                                  ],
                                ),
                                onTap: () => _showTicketActions(t),
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
