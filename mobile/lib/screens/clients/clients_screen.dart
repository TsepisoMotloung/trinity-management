import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  final _api = ApiService();
  List<Client> _clients = [];
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
      _clients = await _api.getClients(search: _search);
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showForm({Client? client}) {
    final nameC = TextEditingController(text: client?.name ?? '');
    final emailC = TextEditingController(text: client?.email ?? '');
    final phoneC = TextEditingController(text: client?.phone ?? '');
    final contactC = TextEditingController(text: client?.contactPerson ?? '');
    final addressC = TextEditingController(text: client?.address ?? '');
    final cityC = TextEditingController(text: client?.city ?? '');
    final notesC = TextEditingController(text: client?.notes ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(client != null ? 'Edit Client' : 'Add Client', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
              const SizedBox(height: 20),
              TextFormField(controller: nameC, decoration: const InputDecoration(labelText: 'Company / Client Name *')),
              const SizedBox(height: 12),
              TextFormField(controller: contactC, decoration: const InputDecoration(labelText: 'Contact Person')),
              const SizedBox(height: 12),
              TextFormField(controller: emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 12),
              TextFormField(controller: phoneC, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone *', hintText: '+266...')),
              const SizedBox(height: 12),
              TextFormField(controller: addressC, decoration: const InputDecoration(labelText: 'Address')),
              const SizedBox(height: 12),
              TextFormField(controller: cityC, decoration: const InputDecoration(labelText: 'City')),
              const SizedBox(height: 12),
              TextFormField(controller: notesC, maxLines: 2, decoration: const InputDecoration(labelText: 'Notes')),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  if (nameC.text.isEmpty || phoneC.text.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name and phone are required')));
                    return;
                  }
                  final data = {
                    'name': nameC.text,
                    'contactPerson': contactC.text.isNotEmpty ? contactC.text : null,
                    'email': emailC.text.isNotEmpty ? emailC.text : null,
                    'phone': phoneC.text,
                    'address': addressC.text.isNotEmpty ? addressC.text : null,
                    'city': cityC.text.isNotEmpty ? cityC.text : null,
                    'notes': notesC.text.isNotEmpty ? notesC.text : null,
                  };
                  try {
                    if (client != null) {
                      await _api.updateClient(client.id, data);
                    } else {
                      await _api.createClient(data);
                    }
                    if (mounted) Navigator.pop(ctx);
                    _loadData();
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(client != null ? 'Client updated' : 'Client created')));
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                  }
                },
                child: Text(client != null ? 'Update' : 'Create'),
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
      appBar: AppBar(title: const Text('Clients')),
      floatingActionButton: FloatingActionButton(onPressed: () => _showForm(), child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search clients...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _clients.isEmpty
                    ? const EmptyState(icon: Icons.people, title: 'No clients found')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _clients.length,
                          itemBuilder: (context, index) {
                            final c = _clients[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: AppTheme.primary.withOpacity(0.1),
                                  child: Text(c.name.isNotEmpty ? c.name[0].toUpperCase() : '?', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                                ),
                                title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (c.contactPerson != null) Text(c.contactPerson!, style: const TextStyle(fontSize: 12)),
                                    Text(c.phone, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                    Row(
                                      children: [
                                        Text('${c.eventCount} events', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                        const SizedBox(width: 8),
                                        Text('${c.invoiceCount} invoices', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                      ],
                                    ),
                                  ],
                                ),
                                trailing: c.isActive
                                    ? const Icon(Icons.check_circle, color: AppTheme.success, size: 18)
                                    : const Icon(Icons.cancel, color: AppTheme.textSecondary, size: 18),
                                onTap: () => _showForm(client: c),
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
