class InventoryItem {
  final String productId;
  final String productName;
  final String genericName;
  final String sku;
  final int shelfQuantity;
  final int warehouseQuantity;
  final int totalStock;
  final bool isLowStock;

  InventoryItem({
    required this.productId,
    required this.productName,
    required this.genericName,
    required this.sku,
    required this.shelfQuantity,
    required this.warehouseQuantity,
    required this.totalStock,
    required this.isLowStock,
  });

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    return InventoryItem(
      productId: json['productId'] ?? json['product_id'] ?? '',
      productName: json['productName'] ?? json['product_name'] ?? '',
      genericName: json['genericName'] ?? json['generic_name'] ?? '',
      sku: json['sku'] ?? '',
      shelfQuantity: json['shelfQuantity'] ?? json['shelf_quantity'] ?? 0,
      warehouseQuantity: json['warehouseQuantity'] ?? json['warehouse_quantity'] ?? 0,
      totalStock: json['totalStock'] ?? json['total_stock'] ?? 0,
      isLowStock: json['isLowStock'] ?? json['is_low_stock'] ?? false,
    );
  }
}
