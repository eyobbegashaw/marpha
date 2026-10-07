class Product {
  final String id;
  final String name;
  final String genericName;
  final String sku;
  final String? barcode;
  final String category;
  final double unitPrice;
  final String? dosageForm;
  final String? strength;
  final bool requiresPrescription;
  final bool isAvailable;

  Product({
    required this.id,
    required this.name,
    required this.genericName,
    required this.sku,
    this.barcode,
    required this.category,
    required this.unitPrice,
    this.dosageForm,
    this.strength,
    this.requiresPrescription = false,
    this.isAvailable = true,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      genericName: json['genericName'] ?? json['generic_name'] ?? '',
      sku: json['sku'] ?? '',
      barcode: json['barcode'],
      category: json['category'] ?? 'General',
      unitPrice: (json['unitPrice'] ?? json['unit_price'] ?? 0.0).toDouble(),
      dosageForm: json['dosageForm'] ?? json['dosage_form'],
      strength: json['strength'],
      requiresPrescription: json['requiresPrescription'] ?? json['requires_prescription'] ?? false,
      isAvailable: json['isAvailable'] ?? json['is_available'] ?? true,
    );
  }
}

class BranchAvailability {
  final String branchId;
  final String branchName;
  final String branchCode;
  final String branchAddress;
  final int availableStock;
  final bool isInStock;
  final double unitPrice;

  BranchAvailability({
    required this.branchId,
    required this.branchName,
    required this.branchCode,
    required this.branchAddress,
    required this.availableStock,
    required this.isInStock,
    required this.unitPrice,
  });

  factory BranchAvailability.fromJson(Map<String, dynamic> json) {
    return BranchAvailability(
      branchId: json['branchId'] ?? '',
      branchName: json['branchName'] ?? 'Main Branch',
      branchCode: json['branchCode'] ?? '',
      branchAddress: json['branchAddress'] ?? 'Addis Ababa',
      availableStock: json['availableStock'] ?? 0,
      isInStock: json['isInStock'] ?? false,
      unitPrice: (json['unitPrice'] ?? 0.0).toDouble(),
    );
  }
}
