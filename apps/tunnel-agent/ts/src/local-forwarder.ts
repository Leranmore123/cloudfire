import http from 'node:http';
import https from 'node:https';
import { FrameCodec, MessageType, HttpRequestStartMessage, HttpRequestChunkMessage } from '../../../../packages/protocol/src/index.js';

export class LocalForwarder {
  private localPort: number;
  private localHost: string;
  private protocol: 'http' | 'https';

  // Active in-flight local requests (Key: requestId)
  private activeLocalRequests: Map<string, http.ClientRequest> = new Map();

  constructor(localPort: number, localHost = 'localhost', protocol: 'http' | 'https' = 'http') {
    this.localPort = localPort;
    this.localHost = localHost;
    this.protocol = protocol;
  }

  public handleRequestStart(
    msg: HttpRequestStartMessage,
    sendFrame: (frame: any) => void
  ): void {
    const startTime = Date.now();
    const clientModule = this.protocol === 'https' ? https : http;

    // Filter host headers to target local port
    const headers = { ...msg.headers };
    headers.host = `${this.localHost}:${this.localPort}`;

    const options: http.RequestOptions = {
      hostname: this.localHost,
      port: this.localPort,
      path: msg.path || '/',
      method: msg.method || 'GET',
      headers: headers as any,
      timeout: 30000
    };

    const localReq = clientModule.request(options, (localRes) => {
      let bytesSent = 0;

      // 1. Send HTTP_RESPONSE_START
      sendFrame({
        type: MessageType.HTTP_RESPONSE_START,
        requestId: msg.requestId,
        statusCode: localRes.statusCode || 200,
        statusMessage: localRes.statusMessage,
        headers: localRes.headers,
        timestamp: Date.now()
      });

      // 2. Stream Response Chunks
      localRes.on('data', (chunk: Buffer) => {
        bytesSent += chunk.length;
        sendFrame({
          type: MessageType.HTTP_RESPONSE_CHUNK,
          requestId: msg.requestId,
          chunk: FrameCodec.bufferToBase64(chunk),
          isBinary: true,
          timestamp: Date.now()
        });
      });

      // 3. Send HTTP_RESPONSE_END
      localRes.on('end', () => {
        this.activeLocalRequests.delete(msg.requestId);
        sendFrame({
          type: MessageType.HTTP_RESPONSE_END,
          requestId: msg.requestId,
          durationMs: Date.now() - startTime,
          bytesSent,
          timestamp: Date.now()
        });
      });
    });

    localReq.on('error', (err) => {
      this.activeLocalRequests.delete(msg.requestId);
      console.error(`[LocalForwarder] Error connecting to ${this.localHost}:${this.localPort}:`, err.message);

      sendFrame({
        type: MessageType.ERROR,
        requestId: msg.requestId,
        code: 'LOCAL_CONNECTION_REFUSED',
        message: `Failed to connect to local application at http://${this.localHost}:${this.localPort}. Is your local server running?`,
        timestamp: Date.now()
      });
    });

    this.activeLocalRequests.set(msg.requestId, localReq);
  }

  public handleRequestChunk(msg: HttpRequestChunkMessage): void {
    const localReq = this.activeLocalRequests.get(msg.requestId);
    if (localReq && !localReq.destroyed) {
      const buf = FrameCodec.base64ToBuffer(msg.chunk);
      localReq.write(buf);
    }
  }

  public handleRequestEnd(requestId: string): void {
    const localReq = this.activeLocalRequests.get(requestId);
    if (localReq && !localReq.destroyed) {
      localReq.end();
    }
  }

  public abortRequest(requestId: string): void {
    const localReq = this.activeLocalRequests.get(requestId);
    if (localReq) {
      localReq.destroy();
      this.activeLocalRequests.delete(requestId);
    }
  }
}
