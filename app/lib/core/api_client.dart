import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://10.0.2.2:5000/api/v1'; // Android Emulator alias or localhost

  static Future<Map<String, String>> _getHeaders({bool requiresAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    final prefs = await SharedPreferences.getInstance();
    final tenantCode = prefs.getString('tenant_code') ?? 'SELAM-01';
    headers['X-Tenant-Code'] = tenantCode;

    if (requiresAuth) {
      final token = prefs.getString('auth_token');
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  static Future<dynamic> get(String endpoint, {bool requiresAuth = true}) async {
    try {
      final headers = await _getHeaders(requiresAuth: requiresAuth);
      final response = await http.get(Uri.parse('$baseUrl$endpoint'), headers: headers);
      return _processResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body, {bool requiresAuth = true}) async {
    try {
      final headers = await _getHeaders(requiresAuth: requiresAuth);
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: jsonEncode(body),
      );
      return _processResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body, {bool requiresAuth = true}) async {
    try {
      final headers = await _getHeaders(requiresAuth: requiresAuth);
      final response = await http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: jsonEncode(body),
      );
      return _processResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static dynamic _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      try {
        final err = jsonDecode(response.body);
        throw Exception(err['message'] ?? 'Request failed with status ${response.statusCode}');
      } catch (_) {
        throw Exception('Request failed with status ${response.statusCode}');
      }
    }
  }
}
