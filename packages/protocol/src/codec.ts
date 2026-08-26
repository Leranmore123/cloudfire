import { ProtocolMessage } from './messages.js';

/**
 * High performance frame encoder & decoder
 */
export class FrameCodec {
  /**
   * Encodes a protocol message into a JSON string or raw payload ready for transport
   */
  public static encode(message: ProtocolMessage): string {
    return JSON.stringify(message);
  }

  /**
   * Decodes an incoming string or Buffer into a typed ProtocolMessage
   */
  public static decode(raw: string | Buffer | ArrayBuffer): ProtocolMessage {
    const text = typeof raw === 'string'
      ? raw
      : Buffer.isBuffer(raw)
        ? raw.toString('utf8')
        : Buffer.from(raw).toString('utf8');

    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.type) {
      throw new Error('Invalid wire protocol frame: missing message type');
    }
    return parsed as ProtocolMessage;
  }

  /**
   * Helper to convert Buffer to base64 chunk string
   */
  public static bufferToBase64(buf: Buffer | Uint8Array): string {
    return Buffer.from(buf).toString('base64');
  }

  /**
   * Helper to convert base64 chunk string back to Buffer
   */
  public static base64ToBuffer(b64: string): Buffer {
    return Buffer.from(b64, 'base64');
  }
}
