"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtService {
    static signAccessToken(payload, secret, expiresIn = '7d') {
        return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresIn });
    }
    static signRefreshToken(payload, secret, expiresIn = '30d') {
        return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresIn });
    }
    static verifyToken(token, secret) {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    static decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=jwt.js.map