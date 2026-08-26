"use strict";
/**
 * Turnal Multiplexed Wire Protocol Message Definitions
 *
 * Enables full duplex streaming of HTTP requests, binary bodies,
 * WebSockets, and control frames over a single persistent outbound WebSocket/TLS connection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    // Authentication & Handshake
    MessageType["AUTH_REQ"] = "AUTH_REQ";
    MessageType["AUTH_ACK"] = "AUTH_ACK";
    MessageType["AUTH_FAIL"] = "AUTH_FAIL";
    // Tunnel Registration & Lifecycle
    MessageType["TUNNEL_REGISTER_REQ"] = "TUNNEL_REGISTER_REQ";
    MessageType["TUNNEL_REGISTER_ACK"] = "TUNNEL_REGISTER_ACK";
    MessageType["TUNNEL_REGISTER_FAIL"] = "TUNNEL_REGISTER_FAIL";
    MessageType["TUNNEL_CLOSE"] = "TUNNEL_CLOSE";
    // HTTP Ingress -> Agent (Request)
    MessageType["HTTP_REQUEST_START"] = "HTTP_REQUEST_START";
    MessageType["HTTP_REQUEST_CHUNK"] = "HTTP_REQUEST_CHUNK";
    MessageType["HTTP_REQUEST_END"] = "HTTP_REQUEST_END";
    // Agent -> HTTP Ingress (Response)
    MessageType["HTTP_RESPONSE_START"] = "HTTP_RESPONSE_START";
    MessageType["HTTP_RESPONSE_CHUNK"] = "HTTP_RESPONSE_CHUNK";
    MessageType["HTTP_RESPONSE_END"] = "HTTP_RESPONSE_END";
    // WebSocket Over Tunnel (Bidirectional proxying)
    MessageType["WS_OPEN"] = "WS_OPEN";
    MessageType["WS_FRAME"] = "WS_FRAME";
    MessageType["WS_CLOSE"] = "WS_CLOSE";
    // Health & Monitoring
    MessageType["HEARTBEAT_PING"] = "HEARTBEAT_PING";
    MessageType["HEARTBEAT_PONG"] = "HEARTBEAT_PONG";
    // General Error
    MessageType["ERROR"] = "ERROR";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=messages.js.map