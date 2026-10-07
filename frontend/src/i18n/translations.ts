export type Language = 'en' | 'am';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    am: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation & Common Actions
  'nav.home': { en: 'Home', am: 'መነሻ' },
  'nav.catalog': { en: 'Medicine Catalog', am: 'የመድኃኒቶች ዝርዝር' },
  'nav.availability': { en: 'Live Stock Check', am: 'የክምችት ሁኔታ' },
  'nav.myPurchases': { en: 'My Purchase History', am: 'የግዢ ታሪኬ' },
  'nav.dashboard': { en: 'Executive Dashboard', am: 'ዋና ዳሽቦርድ' },
  'nav.pos': { en: 'POS Checkout', am: 'የሽያጭ ማስተናገጃ (POS)' },
  'nav.inventory': { en: 'Inventory & Stock', am: 'ክምችት እና መጋዘን' },
  'nav.purchases': { en: 'Procurement & Orders', am: 'የዕቃ ግዢ ትዕዛዞች' },
  'nav.batches': { en: 'FEFO & Expiry Monitor', am: 'የባች እና የአገልግሎት ጊዜ' },
  'nav.expenses': { en: 'Operating Expenses', am: 'የስራ ማስኬጃ ወጪዎች' },
  'nav.staff': { en: 'Staff & Roles', am: 'ሰራተኞች እና የስራ ድርሻ' },
  'nav.analytics': { en: 'Intelligence & Analytics', am: 'ትንታኔ እና ሪፖርቶች' },
  'nav.platformAdmin': { en: 'Platform Settings', am: 'የፕላትፎርም አስተዳደር' },
  'nav.login': { en: 'Staff Login', am: 'የሰራተኛ መግቢያ' },
  'nav.logout': { en: 'Sign Out', am: 'ውጣ' },
  'nav.notifications': { en: 'Notifications', am: 'ማሳወቂያዎች' },
  'nav.language': { en: 'Language', am: 'ቋንቋ' },

  // Common UI Buttons
  'btn.search': { en: 'Search', am: 'ፈልግ' },
  'btn.filter': { en: 'Filter', am: 'አጣራ' },
  'btn.transferStock': { en: 'Transfer to Shelf', am: 'ወደ መደርደሪያ አስተላልፍ' },
  'btn.adjustStock': { en: 'Stock Adjustment', am: 'የክምችት ማስተካከያ' },
  'btn.checkout': { en: 'Complete Sale', am: 'ሽያጩን አጠናቅቅ' },
  'btn.receiveGoods': { en: 'Receive Shipment', am: 'ዕቃዎችን ተቀበል' },
  'btn.createPO': { en: 'New Purchase Order', am: 'አዲስ የግዢ ትዕዛዝ' },
  'btn.approve': { en: 'Approve Order', am: 'ትዕዛዙን አጽድቅ' },
  'btn.order': { en: 'Mark as Ordered', am: 'እንደታዘዘ መዝግብ' },
  'btn.cancel': { en: 'Cancel', am: 'ሰርዝ' },
  'btn.save': { en: 'Save Changes', am: 'ለውጦቹን መዝግብ' },
  'btn.preview': { en: 'Live Preview', am: 'ቅድመ ዕይታ' },
  'btn.viewDetails': { en: 'View Details', am: 'ዝርዝሩን ተመልከት' },
  'btn.printReceipt': { en: 'Print Receipt', am: 'ደረሰኝ አትም' },
  'btn.close': { en: 'Close', am: 'ዝጋ' },
  'btn.next': { en: 'Next Step', am: 'ቀጣይ' },
  'btn.prev': { en: 'Previous', am: 'ወደ ኋላ' },
  'btn.skip': { en: 'Skip Tour', am: 'ዝለል' },
  'btn.finishTour': { en: 'Get Started', am: 'ጀምር' },
  'btn.howItWorks': { en: 'How It Works', am: 'እንዴት ይሰራል?' },
  'btn.help': { en: 'Contextual Help', am: 'እርዳታ እና መመሪያ' },

  // Landing Page & Hero
  'hero.badge': { en: 'Enterprise Pharmacy Operations Platform', am: 'ዘመናዊ የፋርማሲ ክምችት እና ሽያጭ መቆጣጠሪያ' },
  'hero.title': { en: 'Modern Pharmacy Operations & Live Stock Intelligence', am: 'ዘመናዊ የፋርማሲ አስተዳደር እና የቀጥታ ክምችት መረጃ' },
  'hero.subtitle': { en: 'Experience verified medicine dispensing, multi-location stock tracking, FEFO batch safety, and real-time community healthcare access.', am: 'ትክክለኛ መድኃኒት ማሰራጨት፣ የመደርደሪያና የመጋዘን ክምችት ቁጥጥር እና የባች አገልግሎት ጊዜ ክትትል በአንድ ላይ።' },
  'hero.searchPlaceholder': { en: 'Search medicine by generic name, brand, or therapeutic category...', am: 'መድኃኒቱን በስም ወይም በዓይነት ይፈልጉ...' },
  'hero.statBranches': { en: 'Connected Branches', am: 'የተገናኙ ቅርንጫፎች' },
  'hero.statMedicines': { en: 'Verified Medicines', am: 'የተመዘገቡ መድኃኒቶች' },
  'hero.statAvailability': { en: 'Stock Accuracy', am: 'የክምችት ትክክለኛነት' },

  // Stock Status Tokens (Semantic)
  'status.available': { en: 'In Stock on Shelf', am: 'በሽያጭ መደርደሪያ ላይ አለ' },
  'status.shelfLow': { en: 'Shelf Stock Low', am: 'በመደርደሪያ ላይ አነስተኛ ነው' },
  'status.shelfEmpty': { en: 'Shelf Empty — Refill from Warehouse', am: 'መደርደሪያው ባዶ ነው — ከመጋዘን ሙላ' },
  'status.warehouseAvailable': { en: 'Warehouse Reserve Available', am: 'በመጋዘን ውስጥ በበቂ ሁኔታ አለ' },
  'status.warehouseLow': { en: 'Warehouse Stock Low', am: 'በመጋዘንም አነስተኛ ነው' },
  'status.outOfStock': { en: 'Completely Out of Stock', am: 'በሁሉም ቦታ ሙሉ በሙሉ አልቋል' },
  'status.expiringSoon': { en: 'Expiring Soon (FEFO Priority)', am: 'የአገልግሎት ጊዜው ሊያበቃ የቀረበ' },
  'status.quarantined': { en: 'Quarantined / Hold', am: 'ለጊዜው የተከለከለ (ኳራንቲን)' },

  // Owner Dashboard
  'owner.kpiRevenue': { en: 'Gross Revenue', am: 'አጠቃላይ ገቢ' },
  'owner.kpiCogs': { en: 'Cost of Goods Sold (COGS)', am: 'የተሸጡ ዕቃዎች ወጪ (COGS)' },
  'owner.kpiGrossProfit': { en: 'Gross Margin', am: 'ጠቅላላ ትርፍ' },
  'owner.kpiExpenses': { en: 'Operating Expenses', am: 'የስራ ማስኬጃ ወጪዎች' },
  'owner.kpiNetProfit': { en: 'Net Operating Profit', am: 'የተጣራ የንግድ ትርፍ' },
  'owner.kpiValuation': { en: 'Total Inventory Valuation', am: 'የክምችት አጠቃላይ የገንዘብ ዋጋ' },
  'owner.chartTitle': { en: 'Revenue vs. Cost Financial Performance', am: 'የገቢ እና የወጪ ንፅፅር ግራፍ' },
  'owner.restockTitle': { en: 'Smart Demand & Restock Insights', am: 'የፍላጎት ትንበያ እና የዕቃ ግዢ ጥቆማ' },
  'owner.topSellingTitle': { en: 'Top Performing Medicines', am: 'ከፍተኛ ሽያጭ ያላቸው መድኃኒቶች' },
  'owner.staffTitle': { en: 'Pharmacy Personnel Management', am: 'የፋርማሲ ሰራተኞች አስተዳደር' },

  // Pharmacist POS & Operations
  'pos.title': { en: 'Fast POS Checkout Terminal', am: 'ፈጣን የሽያጭ ማስተናገጃ መስኮት' },
  'pos.searchMedicine': { en: 'Scan barcode or type medicine name...', am: 'ባርኮድ ይቃኙ ወይም የመድኃኒቱን ስም ይፃፉ...' },
  'pos.cartEmpty': { en: 'Cart is empty. Select items to dispense.', am: 'ቅርጫቱ ባዶ ነው። የሚሰጡትን መድኃኒቶች ይምረጡ።' },
  'pos.fefoBadge': { en: 'FEFO Auto-Allocated', am: 'በቀዳሚነት የሚያልፍበት ተመርጧል' },
  'pos.shelfQty': { en: 'Shelf Available', am: 'በመደርደሪያ ላይ ያለ' },
  'pos.subtotal': { en: 'Subtotal', am: 'ድምር ዋጋ' },
  'pos.tax': { en: 'Tax (15%)', am: 'ግብር (15%)' },
  'pos.total': { en: 'Total Amount', am: 'አጠቃላይ ክፍያ' },
  'pos.customerBuyer': { en: 'Customer Account (Optional)', am: 'የደንበኛ አካውንት (አማራጭ)' },
  'pos.successTitle': { en: 'Sale Completed & Receipt Generated!', am: 'ሽያጩ ተጠናቆ ደረሰኝ ወጥቷል!' },

  // Inventory & Locations
  'inv.overview': { en: 'Location-Based Stock Distribution', am: 'የመደርደሪያ እና የመጋዘን ክምችት ክፍፍል' },
  'inv.transferModalTitle': { en: 'Warehouse to Sales Shelf Stock Refill', am: 'ከመጋዘን ወደ ሽያጭ መደርደሪያ የማዛወሪያ ቅጽ' },
  'inv.sourceLocation': { en: 'Source Location (e.g. Warehouse)', am: 'የመነሻ ቦታ (ለምሳሌ፡ መጋዘን)' },
  'inv.destLocation': { en: 'Destination Location (e.g. Sales Shelf)', am: 'የመድረሻ ቦታ (ለምሳሌ፡ መደርደሪያ)' },
  'inv.transferQty': { en: 'Transfer Quantity', am: 'የሚዛወረው ብዛት' },
  'inv.auditHistory': { en: 'Traceable Stock Movement Audit Log', am: 'የክምችት እንቅስቃሴ የኦዲት መዝገብ' },

  // Notifications
  'notif.title': { en: 'Operational Notification Center', am: 'የስራ ክንውን ማሳወቂያዎች' },
  'notif.unread': { en: 'Unread Alerts', am: 'ያልተነበቡ' },
  'notif.resolved': { en: 'Resolved Operations', am: 'የተስተካከሉ/የተፈቱ' },
  'notif.markRead': { en: 'Mark Read', am: 'እንደተነበበ ምልክት አድርግ' },
  'notif.resolveAction': { en: 'Resolve & Refill', am: 'ችግሩን ፈትተህ አጠናቅቅ' },

  // Customer Experience
  'cust.searchTitle': { en: 'Explore Genuine Medicines & Check Availability', am: 'ጥራት ያላቸውን መድኃኒቶች ይፈልጉ እና ክምችቱን ያረጋግጡ' },
  'cust.purchasesTitle': { en: 'My Medicine Purchase Receipts', am: 'የተገዙ መድኃኒቶች ደረሰኞች' },
  'cust.receiptNo': { en: 'Receipt #', am: 'የደረሰኝ ቁጥር' },
  'cust.dispensedBy': { en: 'Dispensed At', am: 'የተሰጠበት ቦታ' },
  'cust.unitPrice': { en: 'Unit Price', am: 'የአንዱ ዋጋ' },

  // Onboarding Guided Tours
  'onboard.welcomeTitle': { en: 'Welcome to Pharmacy Operations!', am: 'እንኳን ወደ ዘመናዊ የፋርማሲ ሲስተም በደህና መጡ!' },
  'onboard.ownerStep1Title': { en: '1. Executive Performance KPIs', am: '1. ዋና የንግድ አፈጻጸም መረጃዎች' },
  'onboard.ownerStep1Desc': { en: 'Track Revenue, COGS, Net Profit, and overall stock valuation with real-time financial accuracy.', am: 'ገቢን፣ የተሸጡ ዕቃዎች ወጪን፣ የተጣራ ትርፍን እና አጠቃላይ የክምችት ዋጋን በቅጽበት ይከታተሉ።' },
  'onboard.ownerStep2Title': { en: '2. Multi-Location Stock Rules', am: '2. የመደርደሪያ እና የመጋዘን ክምችት መርህ' },
  'onboard.ownerStep2Desc': { en: 'Sales shelf stock is separated from warehouse reserve. Shelf empty triggers an internal refill recommendation, not a duplicate purchase.', am: 'የሽያጭ መደርደሪያ እና የመጋዘን ክምችት የተለዩ ናቸው። መደርደሪያ ሲያልቅ ከመጋዘን እንድትሞሉ ይጠቁማል እንጂ አላስፈላጊ ግዢ አያዝም።' },
  'onboard.ownerStep3Title': { en: '3. Smart Demand & Restock', am: '3. የፍላጎት ትንበያ እና የግዢ ጥቆማ' },
  'onboard.ownerStep3Desc': { en: 'Transparent calculations based on Average Daily Sales (ADS) and lead times help maintain optimal safety stock.', am: 'በቀን በሚሸጠው አማካይ መጠን ላይ ተመስርቶ አስተማማኝ የክምችት መጠን እንዲኖር ይመክራል።' },
  'onboard.pharmaStep1Title': { en: '1. Fast POS Checkout', am: '1. ፈጣን የሽያጭ ማስተናገጃ' },
  'onboard.pharmaStep1Desc': { en: 'Search by generic/brand name or barcode. The system automatically prioritizes the nearest expiry batch (FEFO).', am: 'መድኃኒቱን በስም ወይም በባርኮድ ይፈልጉ። ሲስተሙ በቅድሚያ የሚያልፈውን ባች (FEFO) በራሱ ይመርጥልዎታል።' },
  'onboard.pharmaStep2Title': { en: '2. Warehouse Refill Workflow', am: '2. ከመጋዘን ወደ መደርደሪያ ማዛወር' },
  'onboard.pharmaStep2Desc': { en: 'Easily transfer reserve units from warehouse storage to customer-facing shelves with a single click.', am: 'በቀላሉ ከመጋዘን ክምችት ወደ ሽያጭ መደርደሪያ በአንድ ጠቅታ ያዛውሩ።' },
  'onboard.custStep1Title': { en: '1. Real-Time Medicine Availability', am: '1. የቀጥታ የመድኃኒት ክምችት' },
  'onboard.custStep1Desc': { en: 'Check live availability and dosage instructions across branches before visiting the pharmacy.', am: 'ወደ ፋርማሲው ከመምጣትዎ በፊት መድኃኒቱ መኖሩን እና የአጠቃቀም መመሪያውን ይመልከቱ።' },

  // Home Page Customer Guide & Pharmacy Info
  'home.howToGetMedicineInfo': { en: 'How Customers Can Get Information About Medicines', am: 'ደንበኞች የመድኃኒት መረጃ እንዴት ማግኘት ይችላሉ?' },
  'home.howToGetMedicineInfoSubtitle': { en: 'Follow these quick steps to find verified medications, verify live branch stock, check official pricing, and consult our pharmacists.', am: 'ትክክለኛ መድኃኒቶችን ለማግኘት፣ በቅርንጫፍ ያለውን ክምችት ለማየት፣ ዋጋ ለማረጋገጥ እና ከፋርማሲስቶች ጋር ለመመካከር የሚከተሉትን ቀላል ደረጃዎች ይጠቀሙ።' },
  'home.aboutTitle': { en: 'About Our Pharmacy', am: 'ስለ ፋርማሲያችን' },
  'home.contactTitle': { en: 'Contact & Location', am: 'አድራሻ እና ግንኙነት' },
  'home.phone': { en: 'Direct Phone', am: 'ስልክ' },
  'home.telegram': { en: 'Telegram Channel & Support', am: 'ቴሌግራም' },
  'home.address': { en: 'Dispensary Address', am: 'የፋርማሲው አድራሻ' },
  'home.hours': { en: 'Operating Hours', am: 'የስራ ሰዓት' },
};
