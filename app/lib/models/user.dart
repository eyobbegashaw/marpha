class User {
  final String id;
  final String fullName;
  final String email;
  final String role; // 'PLATFORM_ADMIN' | 'PHARMACY_OWNER' | 'PHACMACIST' | 'CUSTOMER'
  final String? organizationId;
  final String? branchId;
  final String? tenantCode;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.organizationId,
    this.branchId,
    this.tenantCode,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? 'User',
      email: json['email'] ?? '',
      role: json['role'] ?? 'CUSTOMER',
      organizationId: json['organizationId'] ?? json['organization_id'],
      branchId: json['branchId'] ?? json['branch_id'],
      tenantCode: json['tenantCode'] ?? json['tenant_code'],
    );
  }

  bool get isOwner => role == 'PHARMACY_OWNER' || role == 'PLATFORM_ADMIN';
  bool get isPharmacist => role == 'PHARMACIST' || role == 'PHARMACY_OWNER' || role == 'PLATFORM_ADMIN';
  bool get isCustomer => role == 'CUSTOMER';
}
