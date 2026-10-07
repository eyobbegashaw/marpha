import 'dart:ui';

class TenantBranding {
  final String pharmacyName;
  final String displayName;
  final String logoUrl;
  final String primaryColorHex;
  final String secondaryColorHex;
  final String accentColorHex;

  TenantBranding({
    required this.pharmacyName,
    required this.displayName,
    required this.logoUrl,
    required this.primaryColorHex,
    required this.secondaryColorHex,
    required this.accentColorHex,
  });

  factory TenantBranding.fromJson(Map<String, dynamic> json) {
    return TenantBranding(
      pharmacyName: json['pharmacy_name'] ?? 'Abu Pharmacy',
      displayName: json['display_name'] ?? 'Abu Central Pharmacy',
      logoUrl: json['logo_url'] ?? '',
      primaryColorHex: json['primary_color'] ?? '#0D9488',
      secondaryColorHex: json['secondary_color'] ?? '#0F766E',
      accentColorHex: json['accent_color'] ?? '#14B8A6',
    );
  }

  Color get primaryColor => _parseColor(primaryColorHex, const Color(0xFF0D9488));
  Color get secondaryColor => _parseColor(secondaryColorHex, const Color(0xFF0F766E));
  Color get accentColor => _parseColor(accentColorHex, const Color(0xFF14B8A6));

  static Color _parseColor(String hexString, Color defaultColor) {
    try {
      final buffer = StringBuffer();
      if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
      buffer.write(hexString.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return defaultColor;
    }
  }
}

class TenantContent {
  final String heroTitle;
  final String heroSubtitle;
  final String supportPhone;
  final String supportEmail;
  final String footerText;

  TenantContent({
    required this.heroTitle,
    required this.heroSubtitle,
    required this.supportPhone,
    required this.supportEmail,
    required this.footerText,
  });

  factory TenantContent.fromJson(Map<String, dynamic> json) {
    return TenantContent(
      heroTitle: json['hero_title'] ?? 'Verified Medicines & Real-Time Stock',
      heroSubtitle: json['hero_subtitle'] ?? 'Lookup branch availability instantly',
      supportPhone: json['support_phone'] ?? '+251 911 000 000',
      supportEmail: json['support_email'] ?? 'support@pharmacy.com',
      footerText: json['footer_text'] ?? 'Regulated Healthcare Operations',
    );
  }
}

class TenantFeatureFlags {
  final bool allowPublicCatalog;
  final bool allowPublicAvailabilityCheck;
  final bool enableStockAlerts;
  final bool enableFefoWarning;

  TenantFeatureFlags({
    required this.allowPublicCatalog,
    required this.allowPublicAvailabilityCheck,
    required this.enableStockAlerts,
    required this.enableFefoWarning,
  });

  factory TenantFeatureFlags.fromJson(Map<String, dynamic> json) {
    return TenantFeatureFlags(
      allowPublicCatalog: json['allowPublicCatalog'] ?? true,
      allowPublicAvailabilityCheck: json['allowPublicAvailabilityCheck'] ?? true,
      enableStockAlerts: json['enableStockAlerts'] ?? true,
      enableFefoWarning: json['enableFefoWarning'] ?? true,
    );
  }
}

class TenantConfig {
  final String id;
  final String organizationId;
  final String tenantCode;
  final TenantBranding branding;
  final TenantContent content;
  final TenantFeatureFlags featureFlags;

  TenantConfig({
    required this.id,
    required this.organizationId,
    required this.tenantCode,
    required this.branding,
    required this.content,
    required this.featureFlags,
  });

  factory TenantConfig.fromJson(Map<String, dynamic> json) {
    return TenantConfig(
      id: json['id'] ?? '',
      organizationId: json['organization_id'] ?? '',
      tenantCode: json['tenant_code'] ?? 'SELAM-01',
      branding: TenantBranding.fromJson(json['branding'] ?? {}),
      content: TenantContent.fromJson(json['content'] ?? {}),
      featureFlags: TenantFeatureFlags.fromJson(json['feature_flags'] ?? {}),
    );
  }
}
