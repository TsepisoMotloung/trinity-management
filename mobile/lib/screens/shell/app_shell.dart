import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../dashboard/dashboard_screen.dart';
import '../equipment/equipment_screen.dart';
import '../events/events_screen.dart';
import '../clients/clients_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  final _screens = const [
    DashboardScreen(),
    EquipmentScreen(),
    EventsScreen(),
    ClientsScreen(),
    _MoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.speaker_outlined), selectedIcon: Icon(Icons.speaker), label: 'Equipment'),
          NavigationDestination(icon: Icon(Icons.event_outlined), selectedIcon: Icon(Icons.event), label: 'Events'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Clients'),
          NavigationDestination(icon: Icon(Icons.more_horiz), selectedIcon: Icon(Icons.more_horiz), label: 'More'),
        ],
      ),
    );
  }
}

class _MoreScreen extends StatelessWidget {
  const _MoreScreen();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.isAdmin;

    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _MoreTile(icon: Icons.request_quote, title: 'Quotes', route: '/quotes'),
          _MoreTile(icon: Icons.receipt_long, title: 'Invoices', route: '/invoices'),
          _MoreTile(icon: Icons.swap_horiz, title: 'Transactions', route: '/transactions'),
          _MoreTile(icon: Icons.build, title: 'Maintenance', route: '/maintenance'),
          const Divider(height: 24),
          if (isAdmin) _MoreTile(icon: Icons.admin_panel_settings, title: 'Users', route: '/users'),
          if (isAdmin) _MoreTile(icon: Icons.history, title: 'Activity Log', route: '/activity'),
          _MoreTile(icon: Icons.notifications_outlined, title: 'Notifications', route: '/notifications'),
          _MoreTile(icon: Icons.menu_book, title: 'Training Guide', route: '/training'),
          const Divider(height: 24),
          _MoreTile(icon: Icons.settings, title: 'Settings', route: '/settings'),
        ],
      ),
    );
  }
}

class _MoreTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String route;

  const _MoreTile({required this.icon, required this.title, required this.route});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).primaryColor),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        onTap: () => Navigator.pushNamed(context, route),
      ),
    );
  }
}
