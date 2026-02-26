# Trinity Sound Mobile App

Flutter mobile application for Trinity Sound Management System. Connects to the same NestJS backend as the web frontend.

## Prerequisites

- Flutter SDK >= 3.0.0
- Android Studio with Android SDK
- Android emulator or physical device

## Getting Started

### 1. Install dependencies

```bash
cd mobile
flutter pub get
```

### 2. Configure API URL

The app connects to `http://10.0.2.2:3001/api/v1` by default (Android emulator → host machine). 

If running on a physical device, update the `baseUrl` in `lib/services/api_service.dart` to your machine's IP:

```dart
static const String baseUrl = 'http://YOUR_IP:3001/api/v1';
```

### 3. Make sure the backend is running

```bash
cd ../backend
npm run start:dev
```

### 4. Run the app

```bash
flutter run
```

Or build an APK:

```bash
flutter build apk
```

## Project Structure

```
lib/
├── main.dart                    # App entry point, Provider setup, routes
├── models/
│   └── models.dart              # All data models & enums
├── services/
│   └── api_service.dart         # HTTP client with auth (Dio)
├── providers/
│   └── auth_provider.dart       # Authentication state (ChangeNotifier)
├── utils/
│   ├── theme.dart               # Material 3 theme, colors
│   └── helpers.dart             # formatCurrency (M), dates, timeAgo
├── widgets/
│   └── common_widgets.dart      # StatusBadge, StatCard, EmptyState, etc.
└── screens/
    ├── auth/
    │   ├── login_screen.dart
    │   ├── register_screen.dart
    │   └── forgot_password_screen.dart
    ├── shell/
    │   └── app_shell.dart       # Bottom navigation with 5 tabs
    ├── dashboard/
    │   └── dashboard_screen.dart
    ├── equipment/
    │   └── equipment_screen.dart
    ├── events/
    │   └── events_screen.dart   # + EventDetailScreen
    ├── clients/
    │   └── clients_screen.dart
    ├── quotes/
    │   └── quotes_screen.dart
    ├── invoices/
    │   └── invoices_screen.dart
    ├── transactions/
    │   └── transactions_screen.dart
    ├── maintenance/
    │   └── maintenance_screen.dart
    ├── users/
    │   └── users_screen.dart    # Admin only
    ├── notifications/
    │   └── notifications_screen.dart
    ├── activity/
    │   └── action_logs_screen.dart
    ├── training/
    │   └── training_screen.dart
    └── settings/
        └── settings_screen.dart
```

## Features

All functionality from the web frontend is mirrored:

- **Authentication** – Login, Register (with admin approval), Forgot Password
- **Dashboard** – Stats overview, equipment status, financial summary, recent activity
- **Equipment** – CRUD, status management, search & filter
- **Events** – CRUD, equipment bookings, staff assignments, status workflow
- **Clients** – CRUD, contact management, active/inactive
- **Quotes** – Create with line items, status workflow (Draft → Sent → Accepted/Rejected)
- **Invoices** – Create from quotes, line items, payment recording
- **Transactions** – Check-out / Check-in equipment for events, condition tracking
- **Maintenance** – Tickets with priority, assignment, resolution tracking
- **Users** – Admin user management (approve, reject, activate/deactivate)
- **Notifications** – In-app notification center
- **Activity Log** – System-wide action history
- **Training Guide** – 10 expandable sections covering the full business flow
- **Settings** – Edit profile, change password, logout

## Tech Stack

- **Flutter** with Material 3 design
- **Provider** for state management
- **Dio** for HTTP with JWT auth & token refresh
- **flutter_secure_storage** for token storage
- **fl_chart** for charts
- **intl** for date/currency formatting
- **google_fonts** for Inter font family

## Login Credentials

- Email: `thabo.molefe@trinitysound.co.ls`
- Password: `password123`
