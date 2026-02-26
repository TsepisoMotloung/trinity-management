import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class QuotesScreen extends StatefulWidget {
  const QuotesScreen({super.key});

  @override
  State<QuotesScreen> createState() => _QuotesScreenState();
}

class _QuotesScreenState extends State<QuotesScreen> {
  final _api = ApiService();
  List<Quote> _quotes = [];
  List<Client> _clients = [];
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
        _api.getQuotes(search: _search, status: _statusFilter),
        _api.getClients(take: 200),
      ]);
      if (mounted) {
        setState(() {
          _quotes = results[0] as List<Quote>;
          _clients = results[1] as List<Client>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    String? clientId;
    final typeC = TextEditingController(text: 'Sound Equipment Rental');
    final proposedNameC = TextEditingController();
    final proposedVenueC = TextEditingController();
    DateTime? validUntil = DateTime.now().add(const Duration(days: 30));
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
                const Text('Create Quote', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 20),
                DropdownButtonFormField<String>(
                  value: clientId,
                  decoration: const InputDecoration(labelText: 'Client *'),
                  items: _clients.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                  onChanged: (v) => setSheetState(() => clientId = v),
                ),
                const SizedBox(height: 12),
                TextFormField(controller: typeC, decoration: const InputDecoration(labelText: 'Quote Type')),
                const SizedBox(height: 12),
                TextFormField(controller: proposedNameC, decoration: const InputDecoration(labelText: 'Proposed Event Name')),
                const SizedBox(height: 12),
                TextFormField(controller: proposedVenueC, decoration: const InputDecoration(labelText: 'Proposed Venue')),
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
                    if (clientId == null) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a client')));
                      return;
                    }
                    try {
                      await _api.createQuote({
                        'clientId': clientId,
                        'quoteType': typeC.text,
                        'proposedEventName': proposedNameC.text.isNotEmpty ? proposedNameC.text : null,
                        'proposedVenue': proposedVenueC.text.isNotEmpty ? proposedVenueC.text : null,
                        'validUntil': validUntil?.toIso8601String(),  // ignore: invalid_null_aware_operator
                        'lineItems': lineItems.where((l) => l['description'].isNotEmpty).toList(),
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Quote created')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: const Text('Create Quote'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showQuoteActions(Quote quote) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(quote.quoteNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            Text('${quote.client?.name ?? ''} • ${formatCurrency(quote.total)}', style: const TextStyle(color: AppTheme.textSecondary)),
            const SizedBox(height: 16),
            if (quote.status == QuoteStatus.draft)
              ListTile(
                leading: const Icon(Icons.send, color: AppTheme.primary),
                title: const Text('Mark as Sent'),
                onTap: () async {
                  Navigator.pop(ctx);
                  await _api.updateQuoteStatus(quote.id, 'SENT');
                  _loadData();
                },
              ),
            if (quote.status == QuoteStatus.sent) ...[
              ListTile(
                leading: const Icon(Icons.check_circle, color: AppTheme.success),
                title: const Text('Mark as Accepted'),
                onTap: () async {
                  Navigator.pop(ctx);
                  await _api.updateQuoteStatus(quote.id, 'ACCEPTED');
                  _loadData();
                },
              ),
              ListTile(
                leading: const Icon(Icons.cancel, color: AppTheme.error),
                title: const Text('Mark as Rejected'),
                onTap: () async {
                  Navigator.pop(ctx);
                  await _api.updateQuoteStatus(quote.id, 'REJECTED');
                  _loadData();
                },
              ),
            ],
            if (quote.status == QuoteStatus.accepted)
              ListTile(
                leading: const Icon(Icons.receipt_long, color: AppTheme.primary),
                title: const Text('Create Invoice from Quote'),
                onTap: () async {
                  Navigator.pop(ctx);
                  try {
                    await _api.createInvoiceFromQuote(quote.id);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice created from quote')));
                    _loadData();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                  }
                },
              ),
            ListTile(
              leading: const Icon(Icons.delete, color: AppTheme.error),
              title: const Text('Delete Quote'),
              onTap: () async {
                Navigator.pop(ctx);
                await _api.deleteQuote(quote.id);
                _loadData();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quotes')),
      floatingActionButton: FloatingActionButton(onPressed: _showCreateDialog, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search quotes...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          FilterChipRow(
            options: const ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
            selected: _statusFilter,
            onSelected: (v) { _statusFilter = v; _loadData(); },
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _quotes.isEmpty
                    ? const EmptyState(icon: Icons.description, title: 'No quotes found')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _quotes.length,
                          itemBuilder: (context, index) {
                            final q = _quotes[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                title: Row(
                                  children: [
                                    Expanded(child: Text(q.quoteNumber, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                                    StatusBadge(status: q.status.value, label: q.status.label),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text(q.client?.name ?? '-', style: const TextStyle(fontSize: 12)),
                                    if (q.proposedEventName != null) Text(q.proposedEventName!, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(formatDate(q.issueDate), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                        Text(formatCurrency(q.total), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                                      ],
                                    ),
                                  ],
                                ),
                                onTap: () => _showQuoteActions(q),
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
