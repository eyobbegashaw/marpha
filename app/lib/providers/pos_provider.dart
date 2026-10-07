import 'package:flutter/material.dart';
import '../models/product.dart';
import '../core/api_client.dart';
import '../core/offline_sync.dart';

class PosCartItem {
  final Product product;
  int quantity;
  double unitPrice;

  PosCartItem({
    required this.product,
    this.quantity = 1,
    required this.unitPrice,
  });

  double get subtotal => quantity * unitPrice;
}

class PosProvider extends ChangeNotifier {
  final List<PosCartItem> _cart = [];
  bool _isProcessing = false;
  String? _lastReceiptNumber;

  List<PosCartItem> get cart => _cart;
  bool get isProcessing => _isProcessing;
  String? get lastReceiptNumber => _lastReceiptNumber;

  double get subtotal => _cart.fold(0.0, (acc, item) => acc + item.subtotal);
  double get tax => subtotal * 0.15;
  double get grandTotal => subtotal + tax;

  void addItem(Product product, {int qty = 1}) {
    final existingIndex = _cart.indexWhere((i) => i.product.id == product.id);
    if (existingIndex >= 0) {
      _cart[existingIndex].quantity += qty;
    } else {
      _cart.add(PosCartItem(
        product: product,
        quantity: qty,
        unitPrice: product.unitPrice,
      ));
    }
    notifyListeners();
  }

  void updateQuantity(String productId, int newQty) {
    if (newQty <= 0) {
      _cart.removeWhere((i) => i.product.id == productId);
    } else {
      final item = _cart.firstWhere((i) => i.product.id == productId);
      item.quantity = newQty;
    }
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _lastReceiptNumber = null;
    notifyListeners();
  }

  Future<bool> checkout({String notes = 'Mobile POS Dispense'}) async {
    if (_cart.isEmpty) return false;
    _isProcessing = true;
    notifyListeners();

    final payload = {
      'items': _cart.map((item) => {
        'productId': item.product.id,
        'quantity': item.quantity,
        'unitPrice': item.unitPrice,
      }).toList(),
      'notes': notes,
    };

    try {
      final res = await ApiClient.post('/sales', payload);
      _lastReceiptNumber = res['data']['sale']['receiptNumber'] ?? 'RCP-${DateTime.now().millisecondsSinceEpoch}';
      _cart.clear();
      _isProcessing = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Offline fallback: Queue locally
      await OfflineSyncManager.enqueueOfflineSale(payload);
      _lastReceiptNumber = 'OFFLINE-QUEUED-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      _cart.clear();
      _isProcessing = false;
      notifyListeners();
      return true;
    }
  }
}
