"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const index_js_1 = require("../../shared/src/index.js");
class ApiKeyService {
    /**
     * Generates a new cryptographically secure API key with prefix
     * e.g. trk_live_9f83a... (48 hex chars)
     */
    static generateApiKey() {
        const randomBytes = node_crypto_1.default.randomBytes(24).toString('hex');
        const apiKey = `${index_js_1.API_KEY_PREFIX}${randomBytes}`;
        const keyPrefix = apiKey.substring(0, 16) + '...';
        const hash = this.hashApiKey(apiKey);
        return {
            apiKey,
            keyPrefix,
            hash
        };
    }
    /**
     * Secure SHA-256 hash for database storage & lookup
     */
    static hashApiKey(apiKey) {
        return node_crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
    }
    /**
     * Generates a random DNS verification token
     */
    static generateDomainToken() {
        return node_crypto_1.default.randomBytes(16).toString('hex');
    }
}
exports.ApiKeyService = ApiKeyService;
//# sourceMappingURL=apikey.js.map