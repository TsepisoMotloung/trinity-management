'use client';

import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Calendar,
  Package,
  DollarSign,
  ArrowLeftRight,
  Wrench,
  Shield,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
}

const guides: GuideSection[] = [
  {
    id: 'overview',
    title: 'Getting Started',
    icon: LayoutDashboard,
    badge: 'Start Here',
    steps: [
      {
        title: 'Log in to your account',
        description:
          'Navigate to the login page and enter your email and password. If you don\'t have an account, click "Create account" to register. New accounts require admin approval before you can access the system.',
        tip: 'Contact your administrator if your account hasn\'t been approved yet.',
      },
      {
        title: 'Understand the Dashboard',
        description:
          'The Dashboard is your home screen. It shows key metrics like total equipment items, active events, pending invoices, and revenue. Use it to get a quick snapshot of your business at any time.',
      },
      {
        title: 'Navigate with the Sidebar',
        description:
          'The sidebar on the left gives you access to all sections: Equipment, Events, Clients, Quotes, Invoices, Transactions, Maintenance, and more. On mobile, tap the menu icon to open it.',
      },
    ],
  },
  {
    id: 'clients',
    title: 'Managing Clients',
    icon: Users,
    steps: [
      {
        title: 'Add a new client',
        description:
          'Go to Clients → click "Add Client". Fill in the client\'s name, email, phone number, and company (if applicable). All clients are stored centrally and linked to their quotes, events, and invoices.',
        tip: 'Use the +266 country code format for Lesotho phone numbers.',
      },
      {
        title: 'View client details',
        description:
          'Click on any client in the list to see their full profile, including all associated quotes, events, and payment history.',
      },
      {
        title: 'Edit or deactivate a client',
        description:
          'Use the edit button on a client\'s row to update their information. You can also deactivate clients who are no longer active — their historical data will be preserved.',
      },
    ],
  },
  {
    id: 'quotes',
    title: 'Creating Quotes',
    icon: FileText,
    steps: [
      {
        title: 'Create a new quote',
        description:
          'Go to Quotes → click "Create Quote". Select the client, set the event date, and add line items with descriptions and amounts. The system will calculate subtotals and totals automatically.',
        tip: 'All amounts are in Maluti (M). Make sure your pricing is up to date.',
      },
      {
        title: 'Send the quote to the client',
        description:
          'Once the quote is ready, change its status to "Sent". The client will receive the proposal for review. You can track which quotes are pending, accepted, or rejected.',
      },
      {
        title: 'Client accepts the quote',
        description:
          'When a client accepts, update the quote status to "Accepted". This is the green light to create an event from this quote.',
        tip: 'An accepted quote is the foundation of your business flow — it triggers the event creation process.',
      },
    ],
  },
  {
    id: 'business-flow',
    title: 'Business Flow: Quote → Event → Invoice',
    icon: ArrowRight,
    badge: 'Key Workflow',
    steps: [
      {
        title: 'Step 1: Client requests a quote',
        description:
          'A client contacts you about an event. You create a quote detailing the equipment and services you\'ll provide, along with pricing.',
      },
      {
        title: 'Step 2: Client accepts the quote',
        description:
          'The client reviews and accepts the quote. Mark it as "Accepted" in the system.',
      },
      {
        title: 'Step 3: Create the event',
        description:
          'From the accepted quote, create an event. This books the equipment and assigns staff members. The event page lets you pick available equipment and assign roles to staff (Sound Engineer, Lighting Tech, DJ, etc.).',
        tip: 'The system automatically checks equipment availability for your selected dates.',
      },
      {
        title: 'Step 4: Generate the invoice',
        description:
          'Once the event is set up, generate an invoice from the Invoices section. Link it to the event and client. The invoice reflects the agreed pricing from the quote.',
      },
      {
        title: 'Step 5: Collect payment',
        description:
          'Record payments against the invoice as they come in. The system tracks partial payments and outstanding balances. Once fully paid, the invoice is marked as "Paid".',
      },
    ],
  },
  {
    id: 'equipment',
    title: 'Managing Equipment',
    icon: Package,
    steps: [
      {
        title: 'Understand individual tracking',
        description:
          'Each physical piece of equipment is tracked as its own item with a unique serial number. For example, if you have 3 Shure SM58 microphones, each one is a separate entry with its own serial number and status.',
        tip: 'This allows precise tracking — you always know exactly which unit was used at which event.',
      },
      {
        title: 'Add equipment items',
        description:
          'Go to Equipment → click "Add Item". Enter the name, serial number, category, purchase price, and condition. Each item starts with "Available" status.',
      },
      {
        title: 'Track equipment status',
        description:
          'Equipment items can be: Available (ready to book), Reserved (booked for an upcoming event), In Use (currently at an event), Under Maintenance (being repaired), or Damaged. The dashboard shows a summary of all statuses.',
      },
      {
        title: 'Check availability',
        description:
          'When creating an event, the equipment picker automatically shows only items that are available for your selected dates. Items already booked elsewhere won\'t appear.',
      },
    ],
  },
  {
    id: 'events',
    title: 'Managing Events',
    icon: Calendar,
    steps: [
      {
        title: 'Create a new event',
        description:
          'Go to Events → click "New Event". Fill in the event name, client, venue, dates, and description. Then use the equipment and staff pickers to assign resources.',
      },
      {
        title: 'Assign equipment',
        description:
          'In the event form, set the start and end dates first. The equipment picker will then show all available items for that period. Search by name or serial number, and check the boxes to assign items. Each item shows its category badge.',
        tip: 'You can search and filter equipment by name or serial number to quickly find what you need.',
      },
      {
        title: 'Assign staff',
        description:
          'The staff picker shows employees not already assigned to overlapping events. Select team members and assign their roles: Sound Engineer, Lighting Tech, Technician, DJ, Stage Manager, Driver, or Setup Crew.',
      },
      {
        title: 'Track event status',
        description:
          'Events progress through statuses: Confirmed → In Progress → Completed (or Cancelled). Update the status as the event moves through its lifecycle.',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices & Payments',
    icon: DollarSign,
    steps: [
      {
        title: 'Create an invoice',
        description:
          'Go to Invoices → click "Create Invoice". Link it to a client and optionally to an event. Add line items with descriptions, quantities, and unit prices. The system calculates totals.',
        tip: 'Invoice numbers are generated automatically. All amounts are in Maluti (M).',
      },
      {
        title: 'Track payment status',
        description:
          'Invoices show their status: Draft, Sent, Paid, Partially Paid, or Overdue. The system tracks the outstanding balance and highlights overdue invoices.',
      },
      {
        title: 'Record payments',
        description:
          'When a client makes a payment, record it against the invoice. The system supports partial payments and tracks the remaining balance. Payment methods include cash, bank transfer, and mobile money.',
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Check-Out & Check-In',
    icon: ArrowLeftRight,
    steps: [
      {
        title: 'Check out equipment',
        description:
          'Before an event, go to Transactions → "New Check-Out". Select the event and the individual equipment items being taken out. Record who is responsible and any notes.',
        tip: 'Each equipment item is checked out individually — no quantities needed since each is a unique tracked unit.',
      },
      {
        title: 'Check in equipment',
        description:
          'After the event, create a check-in transaction. Select the equipment items being returned and note their condition. If any item is damaged, mark it accordingly — it will be flagged for maintenance.',
      },
      {
        title: 'Track equipment movement',
        description:
          'The Transactions page gives you a complete audit trail of equipment movement. You can see what went out, when it came back, and in what condition. This helps identify patterns and prevent losses.',
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance Tracking',
    icon: Wrench,
    steps: [
      {
        title: 'Log maintenance requests',
        description:
          'When equipment needs repair, go to Maintenance → "New Request". Select the equipment item, describe the issue, set priority (Low, Medium, High, Critical), and assign it if needed.',
      },
      {
        title: 'Track repair progress',
        description:
          'Maintenance requests move through: Requested → In Progress → Completed. Track costs, update notes, and attach details about the repair work performed.',
        tip: 'Equipment under maintenance is automatically marked unavailable for booking until the request is completed.',
      },
      {
        title: 'Review maintenance history',
        description:
          'Each equipment item accumulates a maintenance history. Use this to make decisions about replacing equipment that has frequent or costly repairs.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration (Admin Only)',
    icon: Shield,
    badge: 'Admin',
    steps: [
      {
        title: 'Approve new users',
        description:
          'When someone registers, their account needs admin approval. Go to Users → find pending accounts → approve or reject them. Approved users can immediately log in.',
      },
      {
        title: 'Manage user roles',
        description:
          'Assign roles to users: Admin (full access) or Employee (limited access). Admins can manage users, view all data, and configure the system. Employees can manage equipment, events, and transactions.',
      },
      {
        title: 'View action logs',
        description:
          'The Action Logs page shows a detailed audit trail of all actions performed in the system — who did what and when. Use this for accountability and troubleshooting.',
      },
    ],
  },
];

function GuideCard({ guide }: { guide: GuideSection }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = guide.icon;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {guide.title}
                {guide.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {guide.badge}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {guide.steps.length} step{guide.steps.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4">
            {guide.steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary/60" />
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {step.tip && (
                    <div className="flex items-start gap-2 mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">
                      <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">{step.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Training Guide
        </h1>
        <p className="text-muted-foreground mt-1">
          Learn how to use Trinity Sound Management — step-by-step guides for
          every feature.
        </p>
      </div>

      {/* Quick overview card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-base">
                How Trinity Sound Works
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                The core workflow is:{' '}
                <span className="font-medium text-foreground">
                  Client → Quote → Accept → Event → Invoice → Payment
                </span>
                . A client contacts you, you create a quote. Once accepted, you
                create the event (booking equipment and staff). Then you generate
                an invoice and collect payment. Click any section below to learn
                the details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow diagram */}
      <div className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm">
        {[
          { label: 'Client', icon: Users },
          { label: 'Quote', icon: FileText },
          { label: 'Accept', icon: CheckCircle2 },
          { label: 'Event', icon: Calendar },
          { label: 'Invoice', icon: DollarSign },
          { label: 'Payment', icon: CheckCircle2 },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
            {i < 5 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Guide sections */}
      <div className="space-y-3">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>

      {/* Footer help */}
      <Card>
        <CardContent className="py-5 text-center">
          <p className="text-sm text-muted-foreground">
            Need more help? Contact your system administrator or email{' '}
            <a
              href="mailto:support@trinitysound.co.ls"
              className="text-primary hover:underline"
            >
              support@trinitysound.co.ls
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
