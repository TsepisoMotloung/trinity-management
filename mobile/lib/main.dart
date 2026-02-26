import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'services/api_service.dart';
import 'utils/theme.dart';

import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/shell/app_shell.dart';
import 'screens/quotes/quotes_screen.dart';
import 'screens/invoices/invoices_screen.dart';
import 'screens/transactions/transactions_screen.dart';
import 'screens/maintenance/maintenance_screen.dart';
import 'screens/users/users_screen.dart';
import 'screens/notifications/notifications_screen.dart';
import 'screens/activity/action_logs_screen.dart';
import 'screens/training/training_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/privacy_policy_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TrinityApp());
}

class TrinityApp extends StatelessWidget {
  const TrinityApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(ApiService()),
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'Trinity Sound',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            home: auth.isLoading
                ? const _SplashScreen()
                : auth.isAuthenticated
                    ? const AppShell()
                    : const LoginScreen(),
            routes: {
              '/login': (_) => const LoginScreen(),
              '/register': (_) => const RegisterScreen(),
              '/forgot-password': (_) => const ForgotPasswordScreen(),
              '/home': (_) => const AppShell(),
              '/quotes': (_) => const QuotesScreen(),
              '/invoices': (_) => const InvoicesScreen(),
              '/transactions': (_) => const TransactionsScreen(),
              '/maintenance': (_) => const MaintenanceScreen(),
              '/users': (_) => const UsersScreen(),
              '/notifications': (_) => const NotificationsScreen(),
              '/activity': (_) => const ActionLogsScreen(),
              '/training': (_) => const TrainingScreen(),
              '/settings': (_) => const SettingsScreen(),
              '/privacy-policy': (_) => const PrivacyPolicyScreen(),
            },
          );
        },
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.speaker_group, size: 56, color: AppTheme.primary),
            ),
            const SizedBox(height: 24),
            const Text('Trinity Sound', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
