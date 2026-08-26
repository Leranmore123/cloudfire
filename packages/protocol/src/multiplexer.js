"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamMultiplexer = void 0;
const node_events_1 = require("node:events");
const messages_js_1 = require("./messages.js");
/**
 * StreamMultiplexer handles concurrent in-flight requests and responses
 * without head-of-line blocking across a single physical connection.
 */
class StreamMultiplexer extends node_events_1.EventEmitter {
    inFlightRequests = new Map();
    defaultTimeoutMs;
    constructor(defaultTimeoutMs = 60000) {
        super();
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    /**
     * Register a new pending outbound request waiting for response frames
     */
    registerRequest(requestId, callbacks, timeoutMs) {
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
    routeIncomingMessage(msg) {
        switch (msg.type) {
            case messages_js_1.MessageType.HTTP_RESPONSE_START: {
                const req = this.inFlightRequests.get(msg.requestId);
                if (req && req.onStart) {
                    req.onStart(msg);
                    return true;
                }
                return false;
            }
            case messages_js_1.MessageType.HTTP_RESPONSE_CHUNK: {
                const req = this.inFlightRequests.get(msg.requestId);
                if (req && req.onChunk) {
                    req.onChunk(msg);
                    return true;
                }
                return false;
            }
            case messages_js_1.MessageType.HTTP_RESPONSE_END: {
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
            case messages_js_1.MessageType.ERROR: {
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
    cancelRequest(requestId, reason = 'Request cancelled') {
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
    closeAll(reason = 'Tunnel connection closed') {
        for (const [id, req] of this.inFlightRequests.entries()) {
            clearTimeout(req.timeoutTimer);
            if (req.onError) {
                req.onError(new Error(reason));
            }
        }
        this.inFlightRequests.clear();
    }
    getInFlightCount() {
        return this.inFlightRequests.size;
    }
    handleTimeout(requestId) {
        const req = this.inFlightRequests.get(requestId);
        if (req) {
            this.inFlightRequests.delete(requestId);
            if (req.onError) {
                req.onError(new Error(`Tunnel gateway timeout: no response from agent within ${this.defaultTimeoutMs}ms`));
            }
        }
    }
}
exports.StreamMultiplexer = StreamMultiplexer;
//# sourceMappingURL=multiplexer.js.map