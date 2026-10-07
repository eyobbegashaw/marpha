import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/tenant_provider.dart';
import 'pharmacist/mobile_pos_screen.dart';
import 'owner/mobile_metrics_screen.dart';
import 'customer/customer_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _tenantController = TextEditingController(text: 'SELAM-01');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _tenantController.dispose();
    super.dispose();
  }

  void _fillPreset(String email, String pass, String tenant) {
    _emailController.text = email;
    _passwordController.text = pass;
    _tenantController.text = tenant;
  }

  Future<void> _handleLogin() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final tenantProv = Provider.of<TenantProvider>(context, listen: false);

    final success = await auth.login(
      _emailController.text.trim(),
      _passwordController.text,
      _tenantController.text.trim().toUpperCase(),
    );

    if (success && mounted) {
      await tenantProv.setTenant(_tenantController.text.trim().toUpperCase());
      final user = auth.user;
      if (user?.role == 'PHARMACY_OWNER' || user?.role == 'PLATFORM_ADMIN') {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MobileMetricsScreen()));
      } else if (user?.role == 'PHARMACIST') {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const MobilePosScreen()));
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const CustomerHomeScreen()));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tenant = context.watch<TenantProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff & Customer Login'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 12),
            Icon(Icons.lock_person_rounded, size: 64, color: tenant.branding.primaryColor),
            const SizedBox(height: 16),
            Text(
              'Sign in to ${tenant.branding.displayName}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),

            if (auth.error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Text(auth.error!, style: TextStyle(color: Colors.red.shade800, fontSize: 13)),
              ),

            TextField(
              controller: _tenantController,
              decoration: const InputDecoration(
                labelText: 'Tenant Code',
                prefixIcon: Icon(Icons.business_rounded),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email Address',
                prefixIcon: Icon(Icons.email_outlined),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Password',
                prefixIcon: Icon(Icons.lock_outline),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: auth.loading ? null : _handleLogin,
              child: auth.loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Sign In', style: TextStyle(fontWeight: FontWeight.bold)),
            ),

            const SizedBox(height: 32),
            const Divider(),
            const Text('Demo Quick Credentials:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 8),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  label: const Text('Abu Pharmacist', style: TextStyle(fontSize: 11)),
                  onPressed: () => _fillPreset('pharmacist@selam.com', 'Pharmacist123!', 'SELAM-01'),
                ),
                ActionChip(
                  label: const Text('Abu Owner', style: TextStyle(fontSize: 11)),
                  onPressed: () => _fillPreset('owner@selam.com', 'Owner123!', 'SELAM-01'),
                ),
                ActionChip(
                  label: const Text('Butu Owner', style: TextStyle(fontSize: 11)),
                  onPressed: () => _fillPreset('owner@butu.com', 'Owner123!', 'BUTU-01'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
