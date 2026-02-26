import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailC = TextEditingController();
  bool _isLoading = false;
  bool _sent = false;
  String? _error;

  Future<void> _submit() async {
    if (_emailC.text.trim().isEmpty) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      await ApiService().forgotPassword(_emailC.text.trim());
      setState(() { _sent = true; _isLoading = false; });
    } catch (e) {
      setState(() { _error = ApiService().getErrorMessage(e); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot Password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _sent
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.mark_email_read, size: 64, color: AppTheme.success),
                  const SizedBox(height: 16),
                  const Text('Check your email', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  const Text('We sent a password reset link to your email address.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Back to Login')),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Enter your email to receive a reset link', style: TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 24),
                  if (_error != null) Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(color: AppTheme.error.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                    child: Text(_error!, style: const TextStyle(color: AppTheme.error)),
                  ),
                  TextFormField(
                    controller: _emailC,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Send Reset Link'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
