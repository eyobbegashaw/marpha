import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/tenant_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/pos_provider.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => TenantProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CatalogProvider()),
        ChangeNotifierProvider(create: (_) => PosProvider()),
      ],
      child: const PharmacyMobileApp(),
    ),
  );
}

class PharmacyMobileApp extends StatelessWidget {
  const PharmacyMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    final tenant = context.watch<TenantProvider>();
    final auth = context.watch<AuthProvider>();

    return MaterialApp(
      title: tenant.branding.displayName,
      debugShowCheckedModeBanner: false,
      theme: tenant.themeData,
      locale: auth.locale,
      home: const SplashScreen(),
    );
  }
}
