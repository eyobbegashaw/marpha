"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = exports.translations = void 0;
exports.translations = {
    // Auth & Generic
    LOGIN_SUCCESS: {
        en: 'Login successful',
        am: 'በተሳካ ሁኔታ ገብተዋል',
    },
    INVALID_CREDENTIALS: {
        en: 'Invalid email or password',
        am: 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል',
    },
    UNAUTHORIZED: {
        en: 'Unauthorized access',
        am: 'ያልተፈቀደ መዳረሻ',
    },
    FORBIDDEN: {
        en: 'You do not have permission to perform this action',
        am: 'ይህንን እርምጃ ለመፈፀም ፈቃድ የለዎትም',
    },
    RESOURCE_NOT_FOUND: {
        en: 'Resource not found',
        am: 'የተፈለገው መረጃ አልተገኘም',
    },
    // Inventory & Locations
    INSUFFICIENT_STOCK: {
        en: 'Insufficient stock in the specified location',
        am: 'በተጠቀሰው ቦታ በቂ ክምችት የለም',
    },
    TRANSFER_SUCCESS: {
        en: 'Stock transferred successfully',
        am: 'የመድሃኒት ክምችት ዝውውር በተሳካ ሁኔታ ተከናውኗል',
    },
    EXPIRED_MEDICINE_BLOCKED: {
        en: 'Cannot sell or transfer expired medicine batch',
        am: 'የጊዜው ያለፈበት የመድሃኒት ባች መሸጥ ወይም ማዘዋወር አይቻልም',
    },
    ADJUSTMENT_SUCCESS: {
        en: 'Stock count adjustment recorded successfully',
        am: 'የክምችት ቆጠራ ማስተካከያ በተሳካ ሁኔታ ተመዝግቧል',
    },
    // Sales
    SALE_COMPLETED: {
        en: 'Sale completed successfully',
        am: 'ሽያጭ በተሳካ ሁኔታ ተጠናቋል',
    },
    RETURN_COMPLETED: {
        en: 'Sale return processed successfully',
        am: 'የሽያጭ ተመላሽ በተሳካ ሁኔታ ተከናውኗል',
    },
    // Notifications
    SHELF_EMPTY_TITLE: {
        en: '🟡 Shelf Stock Empty',
        am: '🟡 በመደርደሪያ ላይ ያለ መድሃኒት አልቋል',
    },
    SHELF_LOW_TITLE: {
        en: '🟡 Shelf Stock Low',
        am: '🟡 በመደርደሪያ ላይ ያለ መድሃኒት አነስተኛ ነው',
    },
    WAREHOUSE_LOW_TITLE: {
        en: '🟠 Warehouse Stock Low',
        am: '🟠 በመጋዘን ውስጥ ያለ መድሃኒት አነስተኛ ነው',
    },
    OUT_OF_STOCK_TITLE: {
        en: '🔴 Out of Stock',
        am: '🔴 መድሃኒቱ ሙሉ በሙሉ አልቋል',
    },
    RESTOCK_RECOMMENDATION_TITLE: {
        en: '🟠 Restock Recommendation',
        am: '🟠 ተጨማሪ መድሃኒት የማዘዣ ምክረ-ሀሳብ',
    },
    EXPIRY_SOON_TITLE: {
        en: '⚠️ Medicine Expiring Soon',
        am: '⚠️ በቅርቡ ጊዜው የሚያልፍበት መድሃኒት',
    },
    EXPIRED_TITLE: {
        en: '🚫 Medicine Expired',
        am: '🚫 ጊዜው ያለፈበት መድሃኒት',
    },
};
exports.i18n = {
    get: (key, lang = 'en') => {
        const item = exports.translations[key];
        if (!item)
            return key;
        return item[lang] || item.en;
    },
    localize: (localized, lang = 'en') => {
        return localized[lang] || localized.en;
    },
};
//# sourceMappingURL=i18nHelper.js.map