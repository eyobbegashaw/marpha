"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenHelper = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
exports.tokenHelper = {
    generateToken: (payload) => {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
    },
    verifyToken: (token) => {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
    },
};
//# sourceMappingURL=tokenHelper.js.map