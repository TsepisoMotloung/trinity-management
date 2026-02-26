import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameC = TextEditingController();
  final _lastNameC = TextEditingController();
  final _emailC = TextEditingController();
  final _phoneC = TextEditingController();
  final _passwordC = TextEditingController();
  final _confirmC = TextEditingController();
  bool _isLoading = false;
  bool _obscure = true;
  String? _error;
  bool _success = false;

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordC.text != _confirmC.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() { _isLoading = true; _error = null; });

    final auth = context.read<AuthProvider>();
    final err = await auth.register(
      _firstNameC.text.trim(),
      _lastNameC.text.trim(),
      _emailC.text.trim(),
      _passwordC.text,
      phone: _phoneC.text.trim(),
    );
    if (mounted) {
      setState(() { _isLoading = false; });
      if (err == null) {
        setState(() => _success = true);
      } else {
        setState(() => _error = err);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, size: 80, color: AppTheme.success),
                  const SizedBox(height: 24),
                  const Text('Registration Successful!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  const Text('Your account is pending admin approval. You will be able to sign in once approved.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                      child: const Text('Back to Sign In'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(_error!, style: const TextStyle(color: AppTheme.error)),
                ),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameC,
                      decoration: const InputDecoration(labelText: 'First Name'),
                      validator: (v) => v != null && v.isNotEmpty ? null : 'Required',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameC,
                      decoration: const InputDecoration(labelText: 'Last Name'),
                      validator: (v) => v != null && v.isNotEmpty ? null : 'Required',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailC,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)),
                validator: (v) => v != null && v.contains('@') ? null : 'Enter a valid email',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneC,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone (optional)', prefixIcon: Icon(Icons.phone_outlined), hintText: '+266...'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordC,
                obscureText: _obscure,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outlined),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
                validator: (v) => v != null && v.length >= 6 ? null : 'Min 6 characters',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _confirmC,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Confirm Password', prefixIcon: Icon(Icons.lock_outlined)),
                validator: (v) => v == _passwordC.text ? null : 'Passwords do not match',
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _register,
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Create Account'),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Already have an account? ', style: TextStyle(color: AppTheme.textSecondary)),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Text('Sign in', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstNameC.dispose();
    _lastNameC.dispose();
    _emailC.dispose();
    _phoneC.dispose();
    _passwordC.dispose();
    _confirmC.dispose();
    super.dispose();
  }
}
