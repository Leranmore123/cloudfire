"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
class PasswordService {
    /**
     * Hashes password using Node.js built-in secure scrypt KDF with random salt
     */
    static async hash(password) {
        return new Promise((resolve, reject) => {
            const salt = node_crypto_1.default.randomBytes(16).toString('hex');
            node_crypto_1.default.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err)
                    return reject(err);
                resolve(`${salt}:${derivedKey.toString('hex')}`);
            });
        });
    }
    /**
     * Compares password with stored hash
     */
    static async compare(password, storedHash) {
        return new Promise((resolve, reject) => {
            const [salt, key] = storedHash.split(':');
            if (!salt || !key)
                return resolve(false);
            node_crypto_1.default.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err)
                    return reject(err);
                const keyBuffer = Buffer.from(key, 'hex');
                const match = node_crypto_1.default.timingSafeEqual(derivedKey, keyBuffer);
                resolve(match);
            });
        });
    }
}
exports.PasswordService = PasswordService;
//# sourceMappingURL=password.js.map