class PurchaseItem {
  final String id;
  final String productName;
  final String batchNumber;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  PurchaseItem({
    required this.id,
    required this.productName,
    required this.batchNumber,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory PurchaseItem.fromJson(Map<String, dynamic> json) {
    return PurchaseItem(
      id: json['id'] ?? '',
      productName: json['productName'] ?? json['product_name'] ?? '',
      batchNumber: json['batchNumber'] ?? json['batch_number'] ?? '',
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unitPrice'] ?? json['unit_price'] ?? 0.0).toDouble(),
      totalPrice: (json['totalPrice'] ?? json['total_price'] ?? 0.0).toDouble(),
    );
  }
}

class PurchaseReceipt {
  final String id;
  final String receiptNumber;
  final String branchName;
  final String branchAddress;
  final double totalAmount;
  final double taxAmount;
  final double discountAmount;
  final String createdAt;
  final List<PurchaseItem> items;

  PurchaseReceipt({
    required this.id,
    required this.receiptNumber,
    required this.branchName,
    required this.branchAddress,
    required this.totalAmount,
    required this.taxAmount,
    required this.discountAmount,
    required this.createdAt,
    required this.items,
  });

  factory PurchaseReceipt.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List? ?? [];
    return PurchaseReceipt(
      id: json['id'] ?? '',
      receiptNumber: json['receiptNumber'] ?? json['receipt_number'] ?? 'RCP-000',
      branchName: json['branchName'] ?? json['branch_name'] ?? 'Abu Central Pharmacy',
      branchAddress: json['branchAddress'] ?? json['branch_address'] ?? 'Main Street, Addis Ababa',
      totalAmount: (json['totalAmount'] ?? json['total_amount'] ?? 0.0).toDouble(),
      taxAmount: (json['taxAmount'] ?? json['tax_amount'] ?? 0.0).toDouble(),
      discountAmount: (json['discountAmount'] ?? json['discount_amount'] ?? 0.0).toDouble(),
      createdAt: json['createdAt'] ?? json['created_at'] ?? DateTime.now().toIso8601String(),
      items: rawItems.map((i) => PurchaseItem.fromJson(i)).toList(),
    );
  }
}
