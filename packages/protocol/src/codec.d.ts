import { ProtocolMessage } from './messages.js';
/**
 * High performance frame encoder & decoder
 */
export declare class FrameCodec {
    /**
     * Encodes a protocol message into a JSON string or raw payload ready for transport
     */
    static encode(message: ProtocolMessage): string;
    /**
     * Decodes an incoming string or Buffer into a typed ProtocolMessage
     */
    static decode(raw: string | Buffer | ArrayBuffer): ProtocolMessage;
    /**
     * Helper to convert Buffer to base64 chunk string
     */
    static bufferToBase64(buf: Buffer | Uint8Array): string;
    /**
     * Helper to convert base64 chunk string back to Buffer
     */
    static base64ToBuffer(b64: string): Buffer;
}
//# sourceMappingURL=codec.d.ts.map