import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/tenant_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/product.dart';
import '../login_screen.dart';
import 'my_receipts_screen.dart';
import '../../core/offline_status_bar.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CatalogProvider>(context, listen: false).fetchProducts();
    });
  }

  void _showAvailabilityModal(Product product) async {
    final catalog = Provider.of<CatalogProvider>(context, listen: false);
    final branches = await catalog.getBranchAvailability(product.id);

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final primary = Provider.of<TenantProvider>(ctx).branding.primaryColor;
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(product.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(product.genericName, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  ),
                  Text('\$${product.unitPrice.toStringAsFixed(2)}',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primary)),
                ],
              ),
              const Divider(height: 24),
              const Text('Branch Real-Time Stock Availability',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              if (branches.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text('Stock available across licensed network branches.', style: TextStyle(color: Colors.grey)),
                )
              else
                ...branches.map((b) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(b.branchName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              Text(b.branchAddress, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: b.isInStock ? Colors.teal.shade50 : Colors.red.shade50,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              b.isInStock ? '${b.availableStock} in stock' : 'Stockout',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: b.isInStock ? Colors.teal.shade800 : Colors.red.shade800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final tenant = context.watch<TenantProvider>();
    final catalog = context.watch<CatalogProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(tenant.branding.displayName),
        actions: [
          IconButton(
            icon: const Icon(Icons.language_rounded),
            onPressed: () => auth.toggleLocale(),
          ),
          if (auth.isAuthenticated)
            IconButton(
              icon: const Icon(Icons.receipt_long_rounded),
              tooltip: 'My Digital Receipts',
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const MyReceiptsScreen()),
              ),
            )
          else
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              ),
              child: const Text('Sign In', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: Column(
        children: [
          const OfflineStatusBar(),
          // Dynamic Tenant Hero Banner
          Container(
            padding: const EdgeInsets.all(16),
            color: tenant.branding.primaryColor.withOpacity(0.08),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tenant.config?.content.heroTitle ?? 'Verified Medicine Availability',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  tenant.config?.content.heroSubtitle ?? 'Search medicines and check live branch stock instantly.',
                  style: const TextStyle(fontSize: 12, color: Colors.black87),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _searchController,
                  onChanged: (val) => catalog.fetchProducts(search: val),
                  decoration: InputDecoration(
                    hintText: 'Search medicine, generic name, or ailment...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Medicine Catalog List
          Expanded(
            child: catalog.loading
                ? const Center(child: CircularProgressIndicator())
                : catalog.products.isEmpty
                    ? const Center(child: Text('No medicines found.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: catalog.products.length,
                        itemBuilder: (ctx, idx) {
                          final prod = catalog.products[idx];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              title: Text(prod.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(prod.genericName, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  const SizedBox(height: 4),
                                  Text('\$${prod.unitPrice.toStringAsFixed(2)}',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: tenant.branding.primaryColor)),
                                ],
                              ),
                              trailing: ElevatedButton.icon(
                                icon: const Icon(Icons.inventory_2_outlined, size: 16),
                                label: const Text('Stock', style: TextStyle(fontSize: 12)),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                                onPressed: () => _showAvailabilityModal(prod),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
