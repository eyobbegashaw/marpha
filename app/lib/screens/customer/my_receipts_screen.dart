import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/tenant_provider.dart';
import '../../models/purchase_receipt.dart';

class MyReceiptsScreen extends StatefulWidget {
  const MyReceiptsScreen({super.key});

  @override
  State<MyReceiptsScreen> createState() => _MyReceiptsScreenState();
}

class _MyReceiptsScreenState extends State<MyReceiptsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CatalogProvider>(context, listen: false).fetchMyReceipts();
    });
  }

  void _showReceiptDetail(PurchaseReceipt receipt) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(receipt.receiptNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('\$${receipt.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal)),
                ],
              ),
              Text(receipt.branchName, style: const TextStyle(fontSize: 13, color: Colors.grey)),
              const Divider(height: 24),
              const Text('Dispensed Items', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  itemCount: receipt.items.length,
                  itemBuilder: (c, i) {
                    final item = receipt.items[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                              Text('Batch: ${item.batchNumber}  •  Qty: ${item.quantity}',
                                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
                            ],
                          ),
                          Text('\$${item.totalPrice.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final tenant = context.watch<TenantProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Purchase Receipts'),
      ),
      body: catalog.loading
          ? const Center(child: CircularProgressIndicator())
          : catalog.myReceipts.isEmpty
              ? const Center(child: Text('No verified purchase receipts found.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: catalog.myReceipts.length,
                  itemBuilder: (ctx, idx) {
                    final r = catalog.myReceipts[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: tenant.branding.primaryColor.withOpacity(0.1),
                          child: Icon(Icons.receipt_rounded, color: tenant.branding.primaryColor),
                        ),
                        title: Text(r.receiptNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${r.branchName} • ${r.items.length} items',
                            style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('\$${r.totalAmount.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const Text('Verified', style: TextStyle(fontSize: 11, color: Colors.teal)),
                          ],
                        ),
                        onTap: () => _showReceiptDetail(r),
                      ),
                    );
                  },
                ),
    );
  }
}
