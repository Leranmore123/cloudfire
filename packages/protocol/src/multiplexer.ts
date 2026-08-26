import { EventEmitter } from 'node:events';
import {
  MessageType,
  ProtocolMessage,
  HttpRequestStartMessage,
  HttpRequestChunkMessage,
  HttpRequestEndMessage,
  HttpResponseStartMessage,
  HttpResponseChunkMessage,
  HttpResponseEndMessage,
  ErrorMessage
} from './messages.js';

export interface PendingResponseContext {
  requestId: string;
  onStart?: (msg: HttpResponseStartMessage) => void;
  onChunk?: (msg: HttpResponseChunkMessage) => void;
  onEnd?: (msg: HttpResponseEndMessage) => void;
  onError?: (err: Error) => void;
  timeoutTimer: NodeJS.Timeout;
  startedAt: number;
}

/**
 * StreamMultiplexer handles concurrent in-flight requests and responses
 * without head-of-line blocking across a single physical connection.
 */
export class StreamMultiplexer extends EventEmitter {
  private inFlightRequests: Map<string, PendingResponseContext> = new Map();
  private defaultTimeoutMs: number;

  constructor(defaultTimeoutMs: number = 60000) {
    super();
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Register a new pending outbound request waiting for response frames
   */
  public registerRequest(
    requestId: string,
    callbacks: {
      onStart: (msg: HttpResponseStartMessage) => void;
      onChunk: (msg: HttpResponseChunkMessage) => void;
      onEnd: (msg: HttpResponseEndMessage) => void;
      onError: (err: Error) => void;
    },
    timeoutMs?: number
  ): void {
    const timeout = timeoutMs || this.defaultTimeoutMs;
    const timer = setTimeout(() => {
      this.handleTimeout(requestId);
    }, timeout);

    this.inFlightRequests.set(requestId, {
      requestId,
      ...callbacks,
      timeoutTimer: timer,
      startedAt: Date.now()
    });
  }

  /**
   * Route an incoming protocol message to its matching in-flight request handler
   */
  public routeIncomingMessage(msg: ProtocolMessage): boolean {
    switch (msg.type) {
      case MessageType.HTTP_RESPONSE_START: {
        const req = this.inFlightRequests.get(msg.requestId);
        if (req && req.onStart) {
          req.onStart(msg);
          return true;
        }
        return false;
      }

      case MessageType.HTTP_RESPONSE_CHUNK: {
        const req = this.inFlightRequests.get(msg.requestId);
        if (req && req.onChunk) {
          req.onChunk(msg);
          return true;
        }
        return false;
      }

      case MessageType.HTTP_RESPONSE_END: {
        const req = this.inFlightRequests.get(msg.requestId);
        if (req) {
          clearTimeout(req.timeoutTimer);
          if (req.onEnd) {
            req.onEnd(msg);
          }
          this.inFlightRequests.delete(msg.requestId);
          return true;
        }
        return false;
      }

      case MessageType.ERROR: {
        if (msg.requestId) {
          const req = this.inFlightRequests.get(msg.requestId);
          if (req) {
            clearTimeout(req.timeoutTimer);
            if (req.onError) {
              req.onError(new Error(`Remote agent error [${msg.code}]: ${msg.message}`));
            }
            this.inFlightRequests.delete(msg.requestId);
            return true;
          }
        }
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * Cancel and cleanup a specific request
   */
  public cancelRequest(requestId: string, reason = 'Request cancelled'): void {
    const req = this.inFlightRequests.get(requestId);
    if (req) {
      clearTimeout(req.timeoutTimer);
      if (req.onError) {
        req.onError(new Error(reason));
      }
      this.inFlightRequests.delete(requestId);
    }
  }

  /**
   * Cleanup all pending requests (e.g. on agent disconnect)
   */
  public closeAll(reason = 'Tunnel connection closed'): void {
    for (const [id, req] of this.inFlightRequests.entries()) {
      clearTimeout(req.timeoutTimer);
      if (req.onError) {
        req.onError(new Error(reason));
      }
    }
    this.inFlightRequests.clear();
  }

  public getInFlightCount(): number {
    return this.inFlightRequests.size;
  }

  private handleTimeout(requestId: string): void {
    const req = this.inFlightRequests.get(requestId);
    if (req) {
      this.inFlightRequests.delete(requestId);
      if (req.onError) {
        req.onError(new Error(`Tunnel gateway timeout: no response from agent within ${this.defaultTimeoutMs}ms`));
      }
    }
  }
}
