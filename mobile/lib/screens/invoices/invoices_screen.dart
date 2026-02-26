import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final _api = ApiService();
  List<Invoice> _invoices = [];
  List<Client> _clients = [];
  List<Event> _events = [];
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
        _api.getInvoices(search: _search, status: _statusFilter),
        _api.getClients(take: 200),
        _api.getEvents(take: 200),
      ]);
      if (mounted) {
        setState(() {
          _invoices = results[0] as List<Invoice>;
          _clients = results[1] as List<Client>;
          _events = results[2] as List<Event>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    String? clientId;
    String? eventId;
    DateTime? dueDate = DateTime.now().add(const Duration(days: 30));
    final List<Map<String, dynamic>> lineItems = [{'description': '', 'quantity': 1, 'unitPrice': 0.0}];

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
                const Text('Create Invoice', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  value: clientId,
                  decoration: const InputDecoration(labelText: 'Client *'),
                  items: _clients.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                  onChanged: (v) => setSheetState(() => clientId = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: eventId,
                  decoration: const InputDecoration(labelText: 'Event (optional)'),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('None')),
                    ..._events.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name))),
                  ],
                  onChanged: (v) => setSheetState(() => eventId = v),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () async {
                    final d = await showDatePicker(context: ctx, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                    if (d != null) setSheetState(() => dueDate = d);
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Due Date'),
                    child: Text(dueDate != null ? formatDate(dueDate!.toIso8601String()) : 'Select'),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Line Items', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ...lineItems.asMap().entries.map((entry) {
                  final i = entry.key;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            initialValue: lineItems[i]['description'],
                            decoration: const InputDecoration(labelText: 'Description', isDense: true),
                            onChanged: (v) => lineItems[i]['description'] = v,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            initialValue: '${lineItems[i]['quantity']}',
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Qty', isDense: true),
                            onChanged: (v) => lineItems[i]['quantity'] = int.tryParse(v) ?? 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            initialValue: '${lineItems[i]['unitPrice']}',
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Price (M)', isDense: true),
                            onChanged: (v) => lineItems[i]['unitPrice'] = double.tryParse(v) ?? 0,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.remove_circle, color: AppTheme.error, size: 20),
                          onPressed: lineItems.length > 1 ? () => setSheetState(() => lineItems.removeAt(i)) : null,
                        ),
                      ],
                    ),
                  );
                }),
                TextButton.icon(
                  onPressed: () => setSheetState(() => lineItems.add({'description': '', 'quantity': 1, 'unitPrice': 0.0})),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Line Item'),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    if (clientId == null) return;
                    try {
                      await _api.createInvoice({
                        'clientId': clientId,
                        'eventId': eventId,
                        'dueDate': dueDate?.toIso8601String(),
                        'lineItems': lineItems.where((l) => l['description'].isNotEmpty).toList(),
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice created')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: const Text('Create Invoice'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showPaymentDialog(Invoice invoice) {
    final amountC = TextEditingController();
    final refC = TextEditingController();
    PaymentMethod method = PaymentMethod.cash;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Record Payment - ${invoice.invoiceNumber}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text('Balance: ${formatCurrency(invoice.balanceDue ?? (invoice.total - invoice.amountPaid))}', style: const TextStyle(color: AppTheme.textSecondary)),
              const SizedBox(height: 16),
              TextFormField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount (M) *', prefixText: 'M ')),
              const SizedBox(height: 12),
              DropdownButtonFormField<PaymentMethod>(
                value: method,
                decoration: const InputDecoration(labelText: 'Payment Method'),
                items: PaymentMethod.values.map((m) => DropdownMenuItem(value: m, child: Text(m.label))).toList(),
                onChanged: (v) => setSheetState(() => method = v ?? PaymentMethod.cash),
              ),
              const SizedBox(height: 12),
              TextFormField(controller: refC, decoration: const InputDecoration(labelText: 'Reference Number')),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (amountC.text.isEmpty) return;
                  try {
                    await _api.recordPayment({
                      'invoiceId': invoice.id,
                      'amount': double.parse(amountC.text),
                      'paymentMethod': method.value,
                      'referenceNumber': refC.text.isNotEmpty ? refC.text : null,
                      'paymentDate': DateTime.now().toIso8601String(),
                    });
                    if (mounted) Navigator.pop(ctx);
                    _loadData();
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment recorded')));
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                  }
                },
                child: const Text('Record Payment'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Invoices')),
      floatingActionButton: FloatingActionButton(onPressed: _showCreateDialog, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search invoices...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          FilterChipRow(
            options: const ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'],
            selected: _statusFilter,
            onSelected: (v) { _statusFilter = v; _loadData(); },
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _invoices.isEmpty
                    ? const EmptyState(icon: Icons.receipt_long, title: 'No invoices found')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _invoices.length,
                          itemBuilder: (context, index) {
                            final inv = _invoices[index];
                            final balance = inv.balanceDue ?? (inv.total - inv.amountPaid);
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                title: Row(
                                  children: [
                                    Expanded(child: Text(inv.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                                    StatusBadge(status: inv.status.value, label: inv.status.label),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(inv.client?.name ?? '-', style: const TextStyle(fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('Due: ${formatDate(inv.dueDate)}', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(formatCurrency(inv.total), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                            if (balance > 0)
                                              Text('Balance: ${formatCurrency(balance)}', style: const TextStyle(fontSize: 11, color: AppTheme.error)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                onTap: () => _showPaymentDialog(inv),
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
