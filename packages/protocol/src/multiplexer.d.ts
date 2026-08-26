import { EventEmitter } from 'node:events';
import { ProtocolMessage, HttpResponseStartMessage, HttpResponseChunkMessage, HttpResponseEndMessage } from './messages.js';
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
export declare class StreamMultiplexer extends EventEmitter {
    private inFlightRequests;
    private defaultTimeoutMs;
    constructor(defaultTimeoutMs?: number);
    /**
     * Register a new pending outbound request waiting for response frames
     */
    registerRequest(requestId: string, callbacks: {
        onStart: (msg: HttpResponseStartMessage) => void;
        onChunk: (msg: HttpResponseChunkMessage) => void;
        onEnd: (msg: HttpResponseEndMessage) => void;
        onError: (err: Error) => void;
    }, timeoutMs?: number): void;
    /**
     * Route an incoming protocol message to its matching in-flight request handler
     */
    routeIncomingMessage(msg: ProtocolMessage): boolean;
    /**
     * Cancel and cleanup a specific request
     */
    cancelRequest(requestId: string, reason?: string): void;
    /**
     * Cleanup all pending requests (e.g. on agent disconnect)
     */
    closeAll(reason?: string): void;
    getInFlightCount(): number;
    private handleTimeout;
}
//# sourceMappingURL=multiplexer.d.ts.map