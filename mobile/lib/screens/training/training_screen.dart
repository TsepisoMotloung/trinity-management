import 'package:flutter/material.dart';

class TrainingScreen extends StatelessWidget {
  const TrainingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Training Guide')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _Section(
            title: '1. Getting Started',
            icon: Icons.rocket_launch,
            content: '''Welcome to Trinity Sound Management System!\n
1. Log in with the credentials provided by your administrator.
2. Once logged in you will see the Dashboard with an overview of equipment, events, and finances.
3. Use the bottom navigation to access different modules.
4. Your role determines which features you can access:\n
• Admin – Full access to all features including user management
• Manager – Can manage equipment, events, clients, and finances
• Technician – Can view equipment, check-out/check-in, and maintenance
• Staff – Basic access to view schedules and events''',
          ),
          _Section(
            title: '2. Managing Equipment',
            icon: Icons.speaker,
            content: '''Each physical item is tracked individually.\n
Adding Equipment:
1. Go to the Equipment screen and tap the + button.
2. Enter the name, serial number, and category.
3. Set the replacement price and any notes.
4. The item will be created with status "Available".\n
Status Flow:
• Available → Ready for events
• Booked → Reserved for an upcoming event
• Checked Out → Currently at an event venue
• In Use → Being used at an active event
• Maintenance → Under repair
• Retired → No longer in service\n
To change status, tap the status badge on any equipment item.''',
          ),
          _Section(
            title: '3. Managing Clients',
            icon: Icons.people,
            content: '''Clients are the businesses or individuals who hire your services.\n
Adding a Client:
1. Navigate to Clients and tap the + button.
2. Enter the contact name, company name (optional), email, phone, and address.
3. Save the client.\n
Client records show their event history and invoices.
You can deactivate clients who are no longer active.''',
          ),
          _Section(
            title: '4. Creating Quotes',
            icon: Icons.request_quote,
            content: '''The business flow starts with a quote.\n
1. Go to Quotes and tap the + button.
2. Select the client and quote type (Event Rental, Dry Hire, or Production).
3. Optionally enter proposed event name and venue.
4. Add line items with description, quantity, and unit price.
5. Save the quote – it will be in Draft status.\n
Quote Workflow:
• Draft → Edit and refine
• Sent → Mark as sent to client
• Accepted → Client approved – you can now create an event and invoice
• Rejected → Client declined
• Expired → Quote passed its validity date\n
From an accepted quote, tap "Create Invoice" to generate the invoice automatically.''',
          ),
          _Section(
            title: '5. Managing Events',
            icon: Icons.event,
            content: '''Events represent your gigs and productions.\n
Creating an Event:
1. Go to Events and tap the + button.
2. Select the client, enter the event name, venue.
3. Set the start and end dates.
4. Save the event.\n
Once created you can:
• Add equipment bookings from the event detail screen.
• Assign staff members to the event.
• Track event status through its lifecycle.\n
Event Status Flow:
Planned → Confirmed → In Progress → Completed → Cancelled\n
The event detail screen shows all assigned equipment, staff, and related information.''',
          ),
          _Section(
            title: '6. Invoicing & Payments',
            icon: Icons.receipt_long,
            content: '''Track all financial transactions.\n
Creating an Invoice:
1. Go to Invoices and tap the + button.
2. Select client and optionally link to an event.
3. Set the due date.
4. Add line items with descriptions and amounts.\n
Recording Payments:
1. Open an invoice and tap "Record Payment".
2. Enter the payment amount, select the method (Cash, Bank Transfer, EFT, Cheque, or Mobile Money).
3. Add a reference number if applicable.
4. The invoice status updates automatically (Partial or Paid).\n
Invoice Statuses: Draft → Sent → Partial → Paid / Overdue / Cancelled''',
          ),
          _Section(
            title: '7. Equipment Check-Out / Check-In',
            icon: Icons.swap_horiz,
            content: '''Track equipment leaving and returning to your warehouse.\n
Check-Out:
1. Go to Transactions and open the "Check Out" tab.
2. Select an event (must be Confirmed or In Progress).
3. Select the equipment items to check out.
4. Submit – items change to "Checked Out" status.\n
Check-In:
1. Open a pending transaction and tap "Check In".
2. Select which items to check in.
3. Set the return condition for each item (Good, Fair, Damaged, or Lost).
4. Submit – items return to "Available" (or "Maintenance" if damaged).\n
The Overdue tab shows transactions past their expected return date.''',
          ),
          _Section(
            title: '8. Maintenance',
            icon: Icons.build,
            content: '''Track equipment repairs and servicing.\n
Creating a Ticket:
1. Go to Maintenance and tap the + button.
2. Select the equipment item.
3. Enter a title and describe the issue.
4. Set the priority (Low, Medium, High, Critical).\n
Ticket Workflow:
• Open → New ticket created
• In Progress → Work has started
• Completed → Issue resolved, fill in resolution and cost
• Cancelled → Ticket was cancelled\n
You can assign tickets to specific team members for accountability.''',
          ),
          _Section(
            title: '9. User Management',
            icon: Icons.admin_panel_settings,
            content: '''Admin only. Manage who can access the system.\n
New users register and wait for admin approval.\n
1. Go to Users to see all accounts.
2. Pending users show a clock icon – tap to approve or reject.
3. You can activate or deactivate users.
4. User roles: Admin, Manager, Technician, Staff.\n
Users must be approved before they can log in and access the system.''',
          ),
          _Section(
            title: '10. Tips & Best Practices',
            icon: Icons.lightbulb,
            content: '''• Always create a quote first, then convert to event + invoice when accepted.
• Check equipment in promptly after events to keep inventory accurate.
• Use the maintenance module to track when equipment needs servicing.
• Review the dashboard regularly for financial summaries and activity.
• Keep client contact details up-to-date for smooth communication.
• Use the search and filter features to quickly find what you need.
• Pull to refresh on any list screen to get the latest data.
• All money amounts are in Maloti (M), the Lesotho currency.''',
          ),
        ],
      ),
    );
  }
}

class _Section extends StatefulWidget {
  final String title;
  final IconData icon;
  final String content;

  const _Section({required this.title, required this.icon, required this.content});

  @override
  State<_Section> createState() => _SectionState();
}

class _SectionState extends State<_Section> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _expanded = !_expanded),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(widget.icon, color: Theme.of(context).primaryColor, size: 22),
                  const SizedBox(width: 12),
                  Expanded(child: Text(widget.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
                  Icon(_expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: Colors.grey),
                ],
              ),
              if (_expanded) ...[
                const Divider(height: 20),
                Text(widget.content, style: const TextStyle(fontSize: 13, height: 1.5, color: Colors.black87)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
