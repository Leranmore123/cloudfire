import { WebSocket } from 'ws';
import { StreamMultiplexer, FrameCodec, ProtocolMessage, MessageType } from '../../../packages/protocol/src/index.js';
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from '../../../packages/shared/src/index.js';

export class TunnelSession {
  public readonly id: string;
  public readonly tunnelId: string;
  public readonly subdomain: string;
  public readonly customDomain?: string;
  public readonly userId: string;
  public readonly localTargetPort: number;
  public readonly localTargetHost: string;
  public readonly socket: WebSocket;
  public readonly multiplexer: StreamMultiplexer;

  public isAlive = true;
  public lastHeartbeatAt = Date.now();
  public latencyMs = 0;
  private heartbeatIntervalTimer?: NodeJS.Timeout;

  constructor(params: {
    tunnelId: string;
    subdomain: string;
    customDomain?: string;
    userId: string;
    localTargetPort: number;
    localTargetHost: string;
    socket: WebSocket;
  }) {
    this.id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.tunnelId = params.tunnelId;
    this.subdomain = params.subdomain;
    this.customDomain = params.customDomain;
    this.userId = params.userId;
    this.localTargetPort = params.localTargetPort;
    this.localTargetHost = params.localTargetHost;
    this.socket = params.socket;
    this.multiplexer = new StreamMultiplexer(35000); // 35s per-request timeout

    this.setupSocket();
    this.startHeartbeat();
  }

  private setupSocket(): void {
    this.socket.on('message', (raw) => {
      try {
        const msg = FrameCodec.decode(raw as any);
        this.handleMessage(msg);
      } catch (err) {
        console.error(`[TunnelSession ${this.subdomain}] Error decoding incoming frame:`, err);
      }
    });

    this.socket.on('close', () => {
      this.cleanup();
    });

    this.socket.on('error', (err) => {
      console.error(`[TunnelSession ${this.subdomain}] WebSocket error:`, err);
      this.cleanup();
    });
  }

  public sendMessage(msg: ProtocolMessage): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      const payload = FrameCodec.encode(msg);
      this.socket.send(payload);
    }
  }

  private handleMessage(msg: ProtocolMessage): void {
    // Route to multiplexer first (for response chunks/ends/errors)
    const handledByMultiplexer = this.multiplexer.routeIncomingMessage(msg);
    if (handledByMultiplexer) {
      return;
    }

    // Handle heartbeats & control messages
    switch (msg.type) {
      case MessageType.HEARTBEAT_PONG:
        this.isAlive = true;
        this.lastHeartbeatAt = Date.now();
        if (msg.timestamp) {
          this.latencyMs = Math.max(0, Date.now() - msg.timestamp);
        }
        break;

      case MessageType.HEARTBEAT_PING:
        this.sendMessage({
          type: MessageType.HEARTBEAT_PONG,
          sequence: (msg as any).sequence,
          timestamp: Date.now()
        });
        break;

      default:
        break;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatIntervalTimer = setInterval(() => {
      if (Date.now() - this.lastHeartbeatAt > HEARTBEAT_TIMEOUT_MS) {
        console.warn(`[TunnelSession ${this.subdomain}] Heartbeat timeout. Closing dead connection.`);
        this.cleanup();
        this.socket.terminate();
        return;
      }

      this.sendMessage({
        type: MessageType.HEARTBEAT_PING,
        sequence: Date.now(),
        timestamp: Date.now()
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  public cleanup(): void {
    if (this.heartbeatIntervalTimer) {
      clearInterval(this.heartbeatIntervalTimer);
    }
    this.multiplexer.closeAll('Tunnel session closed by remote agent');
  }
}
