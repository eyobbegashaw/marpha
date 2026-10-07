import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class QuickRefillScreen extends StatefulWidget {
  const QuickRefillScreen({super.key});

  @override
  State<QuickRefillScreen> createState() => _QuickRefillScreenState();
}

class _QuickRefillScreenState extends State<QuickRefillScreen> {
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchInventory();
  }

  Future<void> _fetchInventory() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.get('/inventory/overview');
      setState(() {
        _items = (res['data']['items'] as List? ?? []);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _transferToShelf(String productId, String name) async {
    final qtyController = TextEditingController(text: '10');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Refill $name to Shelf'),
        content: TextField(
          controller: qtyController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Quantity to Transfer'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Transfer')),
        ],
      ),
    );

    if (ok == true) {
      final qty = int.tryParse(qtyController.text) ?? 10;
      try {
        await ApiClient.post('/inventory/transfer', {
          'productId': productId,
          'quantity': qty,
          'notes': 'Mobile quick shelf replenish',
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transferred $qty units of $name to front shelf.')),
        );
        _fetchInventory();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transfer failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Warehouse → Shelf Refill'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _items.length,
              itemBuilder: (ctx, idx) {
                final it = _items[idx];
                final warehouseQty = it['warehouseQuantity'] ?? 0;
                final shelfQty = it['shelfQuantity'] ?? 0;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(it['productName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Shelf: $shelfQty  |  Warehouse: $warehouseQty',
                        style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    trailing: ElevatedButton.icon(
                      icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                      label: const Text('Refill', style: TextStyle(fontSize: 12)),
                      onPressed: warehouseQty > 0
                          ? () => _transferToShelf(it['productId'], it['productName'])
                          : null,
                    ),
                  ),
                );
              },
            ),
    );
  }
}
