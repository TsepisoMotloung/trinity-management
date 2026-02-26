import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../../widgets/common_widgets.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final _api = ApiService();
  List<Event> _events = [];
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
        _api.getEvents(search: _search, status: _statusFilter),
        _api.getClients(take: 200),
      ]);
      if (mounted) {
        setState(() {
          _events = results[0] as List<Event>;
          _clients = results[1] as List<Client>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showCreateDialog() {
    final nameC = TextEditingController();
    final venueC = TextEditingController();
    final typeC = TextEditingController(text: 'Corporate Event');
    final notesC = TextEditingController();
    String? clientId;
    DateTime? startDate;
    DateTime? endDate;

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
                const Text('New Event', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                const SizedBox(height: 20),
                TextFormField(controller: nameC, decoration: const InputDecoration(labelText: 'Event Name *')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: clientId,
                  decoration: const InputDecoration(labelText: 'Client *'),
                  items: _clients.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                  onChanged: (v) => setSheetState(() => clientId = v),
                ),
                const SizedBox(height: 12),
                TextFormField(controller: typeC, decoration: const InputDecoration(labelText: 'Event Type')),
                const SizedBox(height: 12),
                TextFormField(controller: venueC, decoration: const InputDecoration(labelText: 'Venue *')),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final d = await showDatePicker(context: ctx, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                          if (d != null) setSheetState(() => startDate = d);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Start Date *'),
                          child: Text(startDate != null ? formatDate(startDate!.toIso8601String()) : 'Select'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final d = await showDatePicker(context: ctx, firstDate: startDate ?? DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                          if (d != null) setSheetState(() => endDate = d);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'End Date *'),
                          child: Text(endDate != null ? formatDate(endDate!.toIso8601String()) : 'Select'),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(controller: notesC, maxLines: 2, decoration: const InputDecoration(labelText: 'Notes')),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (nameC.text.isEmpty || clientId == null || venueC.text.isEmpty || startDate == null || endDate == null) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fill all required fields')));
                      return;
                    }
                    try {
                      await _api.createEvent({
                        'name': nameC.text,
                        'clientId': clientId,
                        'eventType': typeC.text,
                        'venue': venueC.text,
                        'startDate': startDate!.toIso8601String(),
                        'endDate': endDate!.toIso8601String(),
                        'notes': notesC.text.isNotEmpty ? notesC.text : null,
                      });
                      if (mounted) Navigator.pop(ctx);
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Event created')));
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
                    }
                  },
                  child: const Text('Create Event'),
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
      appBar: AppBar(title: const Text('Events')),
      floatingActionButton: FloatingActionButton(onPressed: _showCreateDialog, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(hint: 'Search events...', onChanged: (v) { _search = v; _loadData(); }),
          ),
          FilterChipRow(
            options: const ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            selected: _statusFilter,
            onSelected: (v) { _statusFilter = v; _loadData(); },
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const LoadingOverlay()
                : _events.isEmpty
                    ? const EmptyState(icon: Icons.event, title: 'No events found')
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _events.length,
                          itemBuilder: (context, index) {
                            final event = _events[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                title: Row(
                                  children: [
                                    Expanded(child: Text(event.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                                    StatusBadge(status: event.status.value, label: event.status.label),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Icon(Icons.person_outline, size: 14, color: AppTheme.textSecondary),
                                        const SizedBox(width: 4),
                                        Text(event.client?.name ?? '-', style: const TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textSecondary),
                                        const SizedBox(width: 4),
                                        Expanded(child: Text(event.venue, style: const TextStyle(fontSize: 12))),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(Icons.calendar_today, size: 14, color: AppTheme.textSecondary),
                                        const SizedBox(width: 4),
                                        Text('${formatDate(event.startDate)} - ${formatDate(event.endDate)}', style: const TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Icon(Icons.inventory_2, size: 14, color: AppTheme.primary),
                                        const SizedBox(width: 4),
                                        Text('${event.equipmentCount} items', style: const TextStyle(fontSize: 11)),
                                        const SizedBox(width: 12),
                                        Icon(Icons.people, size: 14, color: AppTheme.primary),
                                        const SizedBox(width: 4),
                                        Text('${event.staffCount} staff', style: const TextStyle(fontSize: 11)),
                                      ],
                                    ),
                                  ],
                                ),
                                onTap: () => _showEventDetail(event),
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

  void _showEventDetail(Event event) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => EventDetailScreen(eventId: event.id)),
    );
  }
}

class EventDetailScreen extends StatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final _api = ApiService();
  Event? _event;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadEvent();
  }

  Future<void> _loadEvent() async {
    setState(() => _isLoading = true);
    try {
      final event = await _api.getEvent(widget.eventId);
      if (mounted) setState(() { _event = event; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _updateStatus(String status) async {
    try {
      await _api.updateEventStatus(widget.eventId, status);
      _loadEvent();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Status updated to $status')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_api.getErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_event?.name ?? 'Event Details'),
        actions: [
          if (_event != null)
            PopupMenuButton<String>(
              onSelected: _updateStatus,
              itemBuilder: (ctx) => EventStatus.values
                  .map((s) => PopupMenuItem(value: s.value, child: Text(s.label)))
                  .toList(),
              icon: const Icon(Icons.more_vert),
            ),
        ],
      ),
      body: _isLoading
          ? const LoadingOverlay()
          : _event == null
              ? const EmptyState(icon: Icons.error, title: 'Event not found')
              : RefreshIndicator(
                  onRefresh: _loadEvent,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(child: Text(_event!.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600))),
                                  StatusBadge(status: _event!.status.value, label: _event!.status.label),
                                ],
                              ),
                              const Divider(height: 24),
                              DetailRow(label: 'Client', value: _event!.client?.name ?? '-'),
                              DetailRow(label: 'Type', value: _event!.eventType),
                              DetailRow(label: 'Venue', value: _event!.venue),
                              DetailRow(label: 'Start', value: formatDateTime(_event!.startDate)),
                              DetailRow(label: 'End', value: formatDateTime(_event!.endDate)),
                              if (_event!.notes != null) DetailRow(label: 'Notes', value: _event!.notes!),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Equipment bookings
                      Card(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  const Icon(Icons.inventory_2, size: 18, color: AppTheme.primary),
                                  const SizedBox(width: 8),
                                  Text('Equipment (${_event!.equipmentBookings?.length ?? 0})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                            if (_event!.equipmentBookings?.isEmpty ?? true)
                              const Padding(padding: EdgeInsets.all(16), child: Text('No equipment assigned', style: TextStyle(color: AppTheme.textSecondary)))
                            else
                              ...(_event!.equipmentBookings ?? []).map((b) => ListTile(
                                    dense: true,
                                    leading: Container(
                                      width: 36, height: 36,
                                      decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                      child: const Icon(Icons.inventory_2, size: 18, color: AppTheme.primary),
                                    ),
                                    title: Text(b.equipment?.name ?? 'Unknown', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    subtitle: Text(b.equipment?.serialNumber ?? '', style: const TextStyle(fontSize: 11)),
                                    trailing: StatusBadge(status: b.status.value, fontSize: 10),
                                  )),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Staff assignments
                      Card(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  const Icon(Icons.people, size: 18, color: AppTheme.primary),
                                  const SizedBox(width: 8),
                                  Text('Staff (${_event!.staffAssignments?.length ?? 0})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                            if (_event!.staffAssignments?.isEmpty ?? true)
                              const Padding(padding: EdgeInsets.all(16), child: Text('No staff assigned', style: TextStyle(color: AppTheme.textSecondary)))
                            else
                              ...(_event!.staffAssignments ?? []).map((s) => ListTile(
                                    dense: true,
                                    leading: CircleAvatar(
                                      radius: 18,
                                      backgroundColor: AppTheme.primary.withOpacity(0.1),
                                      child: Text(s.user?.initials ?? '?', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                                    ),
                                    title: Text(s.user?.fullName ?? 'Unknown', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    trailing: StatusBadge(status: 'CONFIRMED', label: s.role, fontSize: 10),
                                  )),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
