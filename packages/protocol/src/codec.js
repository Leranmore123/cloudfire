"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameCodec = void 0;
/**
 * High performance frame encoder & decoder
 */
class FrameCodec {
    /**
     * Encodes a protocol message into a JSON string or raw payload ready for transport
     */
    static encode(message) {
        return JSON.stringify(message);
    }
    /**
     * Decodes an incoming string or Buffer into a typed ProtocolMessage
     */
    static decode(raw) {
        const text = typeof raw === 'string'
            ? raw
            : Buffer.isBuffer(raw)
                ? raw.toString('utf8')
                : Buffer.from(raw).toString('utf8');
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || !parsed.type) {
            throw new Error('Invalid wire protocol frame: missing message type');
        }
        return parsed;
    }
    /**
     * Helper to convert Buffer to base64 chunk string
     */
    static bufferToBase64(buf) {
        return Buffer.from(buf).toString('base64');
    }
    /**
     * Helper to convert base64 chunk string back to Buffer
     */
    static base64ToBuffer(b64) {
        return Buffer.from(b64, 'base64');
    }
}
exports.FrameCodec = FrameCodec;
//# sourceMappingURL=codec.js.map