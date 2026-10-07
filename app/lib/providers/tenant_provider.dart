import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/tenant_config.dart';
import '../core/api_client.dart';

class TenantProvider extends ChangeNotifier {
  TenantConfig? _config;
  String _tenantCode = 'SELAM-01';
  bool _loading = false;
  String? _error;

  TenantConfig? get config => _config;
  String get tenantCode => _tenantCode;
  bool get loading => _loading;
  String? get error => _error;

  TenantBranding get branding =>
      _config?.branding ??
      TenantBranding(
        pharmacyName: 'Abu Pharmacy',
        displayName: 'Abu Central Pharmacy',
        logoUrl: '',
        primaryColorHex: '#0D9488',
        secondaryColorHex: '#0F766E',
        accentColorHex: '#14B8A6',
      );

  ThemeData get themeData {
    final primary = branding.primaryColor;
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: branding.secondaryColor,
        tertiary: branding.accentColor,
        surface: const Color(0xFFF8FAFC),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      cardTheme: CardThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 1,
        color: Colors.white,
      ),
    );
  }

  Future<void> initTenant() async {
    final prefs = await SharedPreferences.getInstance();
    _tenantCode = prefs.getString('tenant_code') ?? 'SELAM-01';
    await fetchConfig(_tenantCode);
  }

  Future<void> setTenant(String newCode) async {
    _tenantCode = newCode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('tenant_code', newCode);
    await fetchConfig(newCode);
  }

  Future<void> fetchConfig(String code) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiClient.get('/platform/config/public?tenantCode=$code', requiresAuth: false);
      if (res['data'] != null) {
        _config = TenantConfig.fromJson(res['data']);
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
