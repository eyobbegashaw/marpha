import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/tenant_provider.dart';
import '../providers/auth_provider.dart';
import 'customer/customer_home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final tenantProv = Provider.of<TenantProvider>(context, listen: false);
    final authProv = Provider.of<AuthProvider>(context, listen: false);

    await Future.wait([
      tenantProv.initTenant(),
      authProv.checkExistingAuth(),
    ]);

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const CustomerHomeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tenant = context.watch<TenantProvider>();
    return Scaffold(
      backgroundColor: tenant.branding.primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10)),
                ],
              ),
              child: Icon(Icons.local_pharmacy_rounded, size: 56, color: tenant.branding.primaryColor),
            ),
            const SizedBox(height: 24),
            Text(
              tenant.branding.displayName,
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              tenant.branding.pharmacyName,
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
          ],
        ),
      ),
    );
  }
}
