import 'package:flutter/material.dart';

class AppLocalization {
  final Locale locale;

  AppLocalization(this.locale);

  static AppLocalization of(BuildContext context) {
    return Localizations.of<AppLocalization>(context, AppLocalization) ??
        AppLocalization(const Locale('en'));
  }

  static const _localizedValues = <String, Map<String, String>>{
    'en': {
      'app_name': 'Pharmacy Operations',
      'search_placeholder': 'Search medicines, generics...',
      'check_stock': 'Check Real-Time Stock',
      'in_stock': 'In Stock',
      'out_of_stock': 'Out of Stock',
      'low_stock': 'Low Stock',
      'my_receipts': 'My Digital Receipts',
      'pos_terminal': 'Mobile POS Terminal',
      'scan_barcode': 'Scan Barcode',
      'complete_sale': 'Complete Dispense',
      'warehouse_to_shelf': 'Shelf Replenishment',
      'total': 'Total',
      'receipt_number': 'Receipt #',
      'branch': 'Branch',
      'date': 'Date',
      'items': 'Items',
      'sign_in': 'Sign In',
      'sign_out': 'Sign Out',
      'executive_overview': 'Executive Overview',
      'revenue': 'Revenue',
      'net_profit': 'Net Profit',
    },
    'am': {
      'app_name': 'የፋርማሲ ክንውንና ቁጥጥር',
      'search_placeholder': 'መድኃኒት ወይም ጄኔሪክ ፈልግ...',
      'check_stock': 'የቅርንጫፎች ክምችት እይ',
      'in_stock': 'ክምችት አለ',
      'out_of_stock': 'ክምችት አልቋል',
      'low_stock': 'አነስተኛ ክምችት',
      'my_receipts': 'የግዥ ደረሰኞቼ',
      'pos_terminal': 'የሽያጭ ማስተናገጃ',
      'scan_barcode': 'ባርኮድ ስካን አድርግ',
      'complete_sale': 'ሽያጭ አጠናቅቅ',
      'warehouse_to_shelf': 'ወደ መደርደሪያ ሙላ',
      'total': 'ጠቅላላ ድምር',
      'receipt_number': 'የደረሰኝ ቁጥር',
      'branch': 'ቅርንጫፍ',
      'date': 'ቀን',
      'items': 'ዕቃዎች',
      'sign_in': 'ግባ',
      'sign_out': 'ውጣ',
      'executive_overview': 'አጠቃላይ የንግድ ቁጥጥር',
      'revenue': 'ጠቅላላ ገቢ',
      'net_profit': 'የተጣራ ትርፍ',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }
}
