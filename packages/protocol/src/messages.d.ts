/**
 * Turnal Multiplexed Wire Protocol Message Definitions
 *
 * Enables full duplex streaming of HTTP requests, binary bodies,
 * WebSockets, and control frames over a single persistent outbound WebSocket/TLS connection.
 */
export declare enum MessageType {
    AUTH_REQ = "AUTH_REQ",
    AUTH_ACK = "AUTH_ACK",
    AUTH_FAIL = "AUTH_FAIL",
    TUNNEL_REGISTER_REQ = "TUNNEL_REGISTER_REQ",
    TUNNEL_REGISTER_ACK = "TUNNEL_REGISTER_ACK",
    TUNNEL_REGISTER_FAIL = "TUNNEL_REGISTER_FAIL",
    TUNNEL_CLOSE = "TUNNEL_CLOSE",
    HTTP_REQUEST_START = "HTTP_REQUEST_START",
    HTTP_REQUEST_CHUNK = "HTTP_REQUEST_CHUNK",
    HTTP_REQUEST_END = "HTTP_REQUEST_END",
    HTTP_RESPONSE_START = "HTTP_RESPONSE_START",
    HTTP_RESPONSE_CHUNK = "HTTP_RESPONSE_CHUNK",
    HTTP_RESPONSE_END = "HTTP_RESPONSE_END",
    WS_OPEN = "WS_OPEN",
    WS_FRAME = "WS_FRAME",
    WS_CLOSE = "WS_CLOSE",
    HEARTBEAT_PING = "HEARTBEAT_PING",
    HEARTBEAT_PONG = "HEARTBEAT_PONG",
    ERROR = "ERROR"
}
export interface BaseMessage {
    type: MessageType;
    timestamp: number;
}
export interface AuthReqMessage extends BaseMessage {
    type: MessageType.AUTH_REQ;
    token?: string;
    apiKey?: string;
    deviceId?: string;
    deviceName?: string;
    agentVersion: string;
    platform: string;
}
export interface AuthAckMessage extends BaseMessage {
    type: MessageType.AUTH_ACK;
    userId: string;
    userEmail: string;
    organizationId?: string;
    sessionId: string;
}
export interface AuthFailMessage extends BaseMessage {
    type: MessageType.AUTH_FAIL;
    code: string;
    reason: string;
}
export interface TunnelRegisterReqMessage extends BaseMessage {
    type: MessageType.TUNNEL_REGISTER_REQ;
    tunnelId?: string;
    projectName?: string;
    subdomain?: string;
    customDomain?: string;
    localTargetPort: number;
    localTargetHost?: string;
    protocol?: 'http' | 'https';
}
export interface TunnelRegisterAckMessage extends BaseMessage {
    type: MessageType.TUNNEL_REGISTER_ACK;
    tunnelId: string;
    subdomain: string;
    publicUrl: string;
    customDomain?: string;
    assignedHostnames: string[];
    localTarget: string;
}
export interface TunnelRegisterFailMessage extends BaseMessage {
    type: MessageType.TUNNEL_REGISTER_FAIL;
    code: string;
    reason: string;
}
export interface HttpRequestStartMessage extends BaseMessage {
    type: MessageType.HTTP_REQUEST_START;
    requestId: string;
    method: string;
    url: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    clientIp?: string;
    isTls: boolean;
    httpVersion?: string;
}
export interface HttpRequestChunkMessage extends BaseMessage {
    type: MessageType.HTTP_REQUEST_CHUNK;
    requestId: string;
    chunk: string;
    isBinary?: boolean;
}
export interface HttpRequestEndMessage extends BaseMessage {
    type: MessageType.HTTP_REQUEST_END;
    requestId: string;
}
export interface HttpResponseStartMessage extends BaseMessage {
    type: MessageType.HTTP_RESPONSE_START;
    requestId: string;
    statusCode: number;
    statusMessage?: string;
    headers: Record<string, string | string[] | undefined>;
}
export interface HttpResponseChunkMessage extends BaseMessage {
    type: MessageType.HTTP_RESPONSE_CHUNK;
    requestId: string;
    chunk: string;
    isBinary?: boolean;
}
export interface HttpResponseEndMessage extends BaseMessage {
    type: MessageType.HTTP_RESPONSE_END;
    requestId: string;
    durationMs?: number;
    bytesSent?: number;
}
export interface WsOpenMessage extends BaseMessage {
    type: MessageType.WS_OPEN;
    wsId: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
}
export interface WsFrameMessage extends BaseMessage {
    type: MessageType.WS_FRAME;
    wsId: string;
    isBinary: boolean;
    payload: string;
}
export interface WsCloseMessage extends BaseMessage {
    type: MessageType.WS_CLOSE;
    wsId: string;
    code?: number;
    reason?: string;
}
export interface HeartbeatPingMessage extends BaseMessage {
    type: MessageType.HEARTBEAT_PING;
    sequence: number;
}
export interface HeartbeatPongMessage extends BaseMessage {
    type: MessageType.HEARTBEAT_PONG;
    sequence: number;
    latencyMs?: number;
}
export interface ErrorMessage extends BaseMessage {
    type: MessageType.ERROR;
    requestId?: string;
    code: string;
    message: string;
}
export type ProtocolMessage = AuthReqMessage | AuthAckMessage | AuthFailMessage | TunnelRegisterReqMessage | TunnelRegisterAckMessage | TunnelRegisterFailMessage | HttpRequestStartMessage | HttpRequestChunkMessage | HttpRequestEndMessage | HttpResponseStartMessage | HttpResponseChunkMessage | HttpResponseEndMessage | WsOpenMessage | WsFrameMessage | WsCloseMessage | HeartbeatPingMessage | HeartbeatPongMessage | ErrorMessage;
//# sourceMappingURL=messages.d.ts.map