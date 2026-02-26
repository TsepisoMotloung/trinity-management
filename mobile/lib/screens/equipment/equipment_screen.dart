import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class EquipmentScreen extends StatefulWidget {
  const EquipmentScreen({super.key});

  @override
  State<EquipmentScreen> createState() => _EquipmentScreenState();
}

class _EquipmentScreenState extends State<EquipmentScreen> {
  final _api = ApiService();
  List<EquipmentItem> _items = [];
  List<EquipmentCategory> _categories = [];
  EquipmentStatistics? _stats;
  bool _isLoading = true;
  String _search = '';
  String? _statusFilter;
  String? _categoryFilter;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getEquipmentItems(search: _search, status: _statusFilter, categoryId: _categoryFilter),
        _api.getCategories(),
        _api.getEquipmentStatistics(),
      ]);
      if (mounted) {
        setState(() {
          _items = results[0] as List<EquipmentItem>;
          _categories = results[1] as List<EquipmentCategory>;
          _stats = results[2] as EquipmentStatistics;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    final nameC = TextEditingController();
    final serialC = TextEditingController();
    final priceC = TextEditingController();
    final notesC = TextEditingController();
    String? selectedCategoryId;

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
                const Text('Add Equipment', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 20),
                TextFormField(controller: nameC, decoration: const InputDecoration(labelText: 'Name *')),
                const SizedBox(height: 12),
                TextFormField(controller: serialC, decoration: const InputDecoration(labelText: 'Serial Number')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedCategoryId,
                  decoration: const InputDecoration(labelText: 'Category *'),
                  items: _categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                  onChanged: (v) => setSheetState(() => selectedCategoryId = v),
                ),
                const SizedBox(height: 12),
                TextFormField(controller: priceC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Purchase Price (M)', prefixText: 'M ')),
                const SizedBox(height: 12),
                TextFormField(controller: notesC, maxLines: 2, decoration: const InputDecoration(labelText: 'Notes')),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (nameC.text.isEmpty || selectedCategoryId == null) return;
                    try {
                      await _api.createEquipmentItem({
                        'name': nameC.text,
                        'serialNumber': serialC.text.isNotEmpty ? serialC.text : null,
                        'categoryId': selectedCategoryId,
                        'purchasePrice': priceC.text.isNotEmpty ? double.tryParse(priceC.text) : null,
                        'notes': notesC.text.isNotEmpty ? notesC.text : null,
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Equipment item created')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: const Text('Create'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showStatusDialog(EquipmentItem item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Update Status: ${item.name}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ...EquipmentStatus.values.map((s) => ListTile(
                  leading: Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(color: AppTheme.statusColor(s.value), shape: BoxShape.circle),
                  ),
                  title: Text(s.label),
                  selected: s == item.currentStatus,
                  onTap: () async {
                    Navigator.pop(ctx);
                    try {
                      await _api.updateEquipmentStatus(item.id, s.value);
                      _loadData();
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                )),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Equipment'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search equipment...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          FilterChipRow(
            options: const ['AVAILABLE', 'RESERVED', 'IN_USE', 'DAMAGED', 'UNDER_REPAIR'],
            selected: _statusFilter,
            onSelected: (v) { _statusFilter = v; _loadData(); },
          ),
          const SizedBox(height: 8),
          // Stats bar
          if (_stats != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _miniStat('Total', _stats!.totalItems, AppTheme.textPrimary),
                  _miniStat('Available', _stats!.totalAvailable, AppTheme.success),
                  _miniStat('In Use', _stats!.totalInUse, AppTheme.primary),
                  _miniStat('Damaged', _stats!.totalDamaged, AppTheme.error),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _items.isEmpty
                    ? const EmptyState(icon: Icons.inventory_2, title: 'No equipment found')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _items.length,
                          itemBuilder: (context, index) {
                            final item = _items[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: Container(
                                  width: 42, height: 42,
                                  decoration: BoxDecoration(
                                    color: AppTheme.statusColor(item.currentStatus.value).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(Icons.inventory_2, color: AppTheme.statusColor(item.currentStatus.value), size: 20),
                                ),
                                title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                subtitle: Text(
                                  '${item.category?.name ?? 'Uncategorized'}${item.serialNumber != null ? ' • ${item.serialNumber}' : ''}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                ),
                                trailing: StatusBadge(status: item.currentStatus.value, label: item.currentStatus.label),
                                onTap: () => _showStatusDialog(item),
                                onLongPress: () => _showDeleteDialog(item),
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

  Widget _miniStat(String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          children: [
            Text('$count', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
            Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(EquipmentItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Equipment'),
        content: Text('Delete "${item.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await _api.deleteEquipmentItem(item.id);
                _loadData();
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
              }
            },
            child: const Text('Delete', style: TextStyle(color: AppTheme.error)),
          ),
        ],
      ),
    );
  }
}
