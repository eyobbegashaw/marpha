"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashHelper = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.hashHelper = {
    hash: async (plain) => {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(plain, salt);
    },
    compare: async (plain, hashed) => {
        return bcryptjs_1.default.compare(plain, hashed);
    },
};
//# sourceMappingURL=hashHelper.js.map