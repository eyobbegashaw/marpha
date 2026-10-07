import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../core/api_client.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  bool _loading = false;
  String? _error;
  Locale _locale = const Locale('en');

  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _user != null;
  bool get loading => _loading;
  String? get error => _error;
  Locale get locale => _locale;

  void toggleLocale() {
    _locale = _locale.languageCode == 'en' ? const Locale('am') : const Locale('en');
    notifyListeners();
  }

  Future<void> checkExistingAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    final userJson = prefs.getString('user_data');
    if (_token != null && userJson != null) {
      // Restore user session
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password, String tenantCode) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiClient.post('/auth/login', {
        'email': email,
        'password': password,
      }, requiresAuth: false);

      final token = res['data']['token'];
      final userData = User.fromJson(res['data']['user']);

      _token = token;
      _user = userData;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      await prefs.setString('tenant_code', tenantCode);

      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    notifyListeners();
  }
}
