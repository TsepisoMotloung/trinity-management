import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> with SingleTickerProviderStateMixin {
  final _api = ApiService();
  late TabController _tabController;
  List<CheckOutTransaction> _pending = [];
  List<CheckOutTransaction> _overdue = [];
  List<Event> _events = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getPendingTransactions(),
        _api.getOverdueTransactions(),
        _api.getEvents(take: 200),
      ]);
      if (mounted) {
        setState(() {
          _pending = results[0] as List<CheckOutTransaction>;
          _overdue = results[1] as List<CheckOutTransaction>;
          _events = results[2] as List<Event>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCheckOutDialog() {
    String? eventId;
    List<EquipmentItem> availableItems = [];
    Set<String> selectedIds = {};
    final notesC = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SizedBox(
            height: MediaQuery.of(ctx).size.height * 0.7,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Check Out Equipment', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: eventId,
                  decoration: const InputDecoration(labelText: 'Event *'),
                  items: _events.where((e) => e.status == EventStatus.confirmed || e.status == EventStatus.inProgress)
                      .map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))
                      .toList(),
                  onChanged: (v) async {
                    setSheetState(() { eventId = v; selectedIds.clear(); });
                    if (v != null) {
                      try {
                        final event = await _api.getEvent(v);
                        setSheetState(() {
                          availableItems = event.equipmentBookings
                              ?.map((b) => b.equipment)
                              .where((e) => e != null)
                              .cast<EquipmentItem>()
                              .toList() ?? [];
                        });
                      } catch (_) {}
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(controller: notesC, decoration: const InputDecoration(labelText: 'Notes')),
                const SizedBox(height: 12),
                const Text('Select Equipment:', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                const SizedBox(height: 8),
                Expanded(
                  child: availableItems.isEmpty
                      ? const Center(child: Text('Select an event to see equipment', style: TextStyle(color: AppTheme.textSecondary)))
                      : ListView.builder(
                          itemCount: availableItems.length,
                          itemBuilder: (ctx, i) {
                            final item = availableItems[i];
                            return CheckboxListTile(
                              dense: true,
                              value: selectedIds.contains(item.id),
                              onChanged: (v) => setSheetState(() {
                                if (v == true) selectedIds.add(item.id);
                                else selectedIds.remove(item.id);
                              }),
                              title: Text(item.name, style: const TextStyle(fontSize: 13)),
                              subtitle: Text(item.serialNumber ?? '', style: const TextStyle(fontSize: 11)),
                            );
                          },
                        ),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (eventId == null || selectedIds.isEmpty) return;
                    try {
                      await _api.checkOutEquipment({
                        'eventId': eventId,
                        'notes': notesC.text.isNotEmpty ? notesC.text : null,
                        'items': selectedIds.map((id) => {'equipmentId': id}).toList(),
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Equipment checked out')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: Text('Check Out (${selectedIds.length})'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showCheckInDialog(CheckOutTransaction checkout) {
    Set<String> selectedIds = checkout.items.map((i) => i.equipmentId).toSet();
    Map<String, String> conditions = {for (var i in checkout.items) i.equipmentId: 'GOOD'};
    final notesC = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SizedBox(
            height: MediaQuery.of(ctx).size.height * 0.7,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Check In - ${checkout.event?['name'] ?? ''}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                TextFormField(controller: notesC, decoration: const InputDecoration(labelText: 'Notes')),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.builder(
                    itemCount: checkout.items.length,
                    itemBuilder: (ctx, i) {
                      final item = checkout.items[i];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: Row(
                            children: [
                              Checkbox(
                                value: selectedIds.contains(item.equipmentId),
                                onChanged: (v) => setSheetState(() {
                                  if (v == true) selectedIds.add(item.equipmentId);
                                  else selectedIds.remove(item.equipmentId);
                                }),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.equipment?.name ?? 'Unknown', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    Text(item.equipment?.serialNumber ?? '', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                  ],
                                ),
                              ),
                              SizedBox(
                                width: 100,
                                child: DropdownButtonFormField<String>(
                                  value: conditions[item.equipmentId],
                                  isDense: true,
                                  decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
                                  items: ItemCondition.values.map((c) => DropdownMenuItem(value: c.value, child: Text(c.label, style: const TextStyle(fontSize: 12)))).toList(),
                                  onChanged: (v) => setSheetState(() => conditions[item.equipmentId] = v ?? 'GOOD'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (selectedIds.isEmpty) return;
                    try {
                      await _api.checkInEquipment({
                        'eventId': checkout.eventId,
                        'notes': notesC.text.isNotEmpty ? notesC.text : null,
                        'items': selectedIds.map((id) => {
                          'equipmentId': id,
                          'condition': conditions[id] ?? 'GOOD',
                        }).toList(),
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Equipment checked in')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: Text('Check In (${selectedIds.length})'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primary,
          tabs: [
            Tab(text: 'Pending (${_pending.length})'),
            Tab(text: 'Overdue (${_overdue.length})'),
            const Tab(text: 'Check Out'),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingOverlay()
          : TabBarView(
              controller: _tabController,
              children: [
                _buildTransactionList(_pending, 'No pending check-ins'),
                _buildTransactionList(_overdue, 'No overdue items'),
                Center(
                  child: ElevatedButton.icon(
                    onPressed: _showCheckOutDialog,
                    icon: const Icon(Icons.output),
                    label: const Text('New Check Out'),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildTransactionList(List<CheckOutTransaction> list, String emptyText) {
    if (list.isEmpty) return EmptyState(icon: Icons.swap_horiz, title: emptyText);
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final tx = list[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              contentPadding: const EdgeInsets.all(12),
              leading: Container(
                width: 42, height: 42,
                decoration: BoxDecoration(color: AppTheme.warning.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.output, color: AppTheme.warning, size: 20),
              ),
              title: Text(tx.event?['name'] ?? 'Event', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${tx.items.length} items • ${formatDateTime(tx.checkedOutAt)}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  Text('By: ${tx.checkedOutByUser?.fullName ?? ''}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ],
              ),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textSecondary),
              onTap: () => _showCheckInDialog(tx),
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
