import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pos_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/tenant_provider.dart';
import '../../providers/auth_provider.dart';
import 'quick_refill_screen.dart';
import '../../core/offline_status_bar.dart';

class MobilePosScreen extends StatefulWidget {
  const MobilePosScreen({super.key});

  @override
  State<MobilePosScreen> createState() => _MobilePosScreenState();
}

class _MobilePosScreenState extends State<MobilePosScreen> {
  final _barcodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CatalogProvider>(context, listen: false).fetchProducts();
    });
  }

  void _simulateBarcodeScan(String code) {
    final catalog = Provider.of<CatalogProvider>(context, listen: false);
    final pos = Provider.of<PosProvider>(context, listen: false);

    final match = catalog.products.firstWhere(
      (p) => (p.barcode != null && p.barcode == code) || p.sku.toLowerCase() == code.toLowerCase(),
      orElse: () => catalog.products.isNotEmpty ? catalog.products.first : throw 'Not found',
    );

    pos.addItem(match);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Added ${match.name} to POS cart'), duration: const Duration(seconds: 1)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pos = context.watch<PosProvider>();
    final catalog = context.watch<CatalogProvider>();
    final tenant = context.watch<TenantProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mobile POS Terminal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz_rounded),
            tooltip: 'Shelf Refill',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const QuickRefillScreen()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () {
              auth.logout();
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          const OfflineStatusBar(),
          // Barcode Quick Action Bar
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _barcodeController,
                    decoration: const InputDecoration(
                      hintText: 'Scan or enter SKU / Barcode...',
                      prefixIcon: Icon(Icons.qr_code_scanner_rounded),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (v) {
                      if (v.isNotEmpty) {
                        _simulateBarcodeScan(v);
                        _barcodeController.clear();
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Scan'),
                  onPressed: () {
                    if (catalog.products.isNotEmpty) {
                      _simulateBarcodeScan(catalog.products.first.sku);
                    }
                  },
                ),
              ],
            ),
          ),

          // Cart Items List
          Expanded(
            child: pos.cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.point_of_sale_rounded, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        const Text('Terminal Cart Empty', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                        const SizedBox(height: 4),
                        const Text('Scan barcodes or select products below', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: pos.cart.length,
                    itemBuilder: (ctx, idx) {
                      final item = pos.cart[idx];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    Text('\$${item.unitPrice.toStringAsFixed(2)} / unit',
                                        style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                                    onPressed: () => pos.updateQuantity(item.product.id, item.quantity - 1),
                                  ),
                                  Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, size: 20),
                                    onPressed: () => pos.updateQuantity(item.product.id, item.quantity + 1),
                                  ),
                                ],
                              ),
                              SizedBox(
                                width: 70,
                                child: Text(
                                  '\$${item.subtotal.toStringAsFixed(2)}',
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Bottom Summary & Checkout
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total (incl. 15% VAT):', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    Text('\$${pos.grandTotal.toStringAsFixed(2)}',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: tenant.branding.primaryColor)),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: pos.cart.isEmpty || pos.isProcessing
                        ? null
                        : () async {
                            final ok = await pos.checkout();
                            if (ok && mounted) {
                              showDialog(
                                context: context,
                                builder: (_) => AlertDialog(
                                  title: const Text('Dispensed Successfully'),
                                  content: Text('Receipt #${pos.lastReceiptNumber}\nInventory deducted via FEFO batches.'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(context).pop(),
                                      child: const Text('OK'),
                                    ),
                                  ],
                                ),
                              );
                            }
                          },
                    child: pos.isProcessing
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Complete Sale & Dispense (FEFO)',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
