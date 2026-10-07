import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/purchase_receipt.dart';
import '../core/api_client.dart';

class CatalogProvider extends ChangeNotifier {
  List<Product> _products = [];
  bool _loading = false;
  String? _error;
  List<PurchaseReceipt> _myReceipts = [];

  List<Product> get products => _products;
  bool get loading => _loading;
  String? get error => _error;
  List<PurchaseReceipt> get myReceipts => _myReceipts;

  Future<void> fetchProducts({String? search, String? category}) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      String endpoint = '/products?limit=50';
      if (search != null && search.isNotEmpty) endpoint += '&search=$search';
      if (category != null && category.isNotEmpty) endpoint += '&category=$category';

      final res = await ApiClient.get(endpoint, requiresAuth: false);
      final list = (res['data']['products'] as List? ?? []);
      _products = list.map((item) => Product.fromJson(item)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<List<BranchAvailability>> getBranchAvailability(String productId) async {
    try {
      final res = await ApiClient.get('/products/$productId/availability', requiresAuth: false);
      final list = (res['data']['branches'] as List? ?? []);
      return list.map((b) => BranchAvailability.fromJson(b)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> fetchMyReceipts() async {
    _loading = true;
    notifyListeners();

    try {
      final res = await ApiClient.get('/sales/my-purchases');
      final list = (res['data']['sales'] as List? ?? []);
      _myReceipts = list.map((s) => PurchaseReceipt.fromJson(s)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
