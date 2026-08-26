# 📡 Turnal Multiplexed Wire Protocol Specification

## Protocol Design Principles

1. **Multiplexing over Single Connection**:
   Multiple concurrent HTTP requests are streamed simultaneously over a single persistent outbound WebSocket/TLS connection without head-of-line blocking.
2. **Chunked Streaming**:
   Large payloads (file uploads, video streams, SSR responses) are split into base64-encoded binary chunks and streamed sequentially with matching `requestId` tags.
3. **Low Overhead**:
   Lightweight JSON / Binary framing with microsecond message processing.

---

## Message Framing Structure

Every wire message conforms to the following schema:

```typescript
interface ProtocolMessage {
  type: MessageType;
  timestamp: number;
  [key: string]: any;
}
```

---

## Message Types & Flow

### 1. Connection Handshake & Authentication

```mermaid
sequenceDiagram
    participant Agent as Windows Tunnel Agent
    participant Edge as Turnal Edge Ingress
    participant API as Turnal API

    Agent->>Edge: AUTH_REQ { token / apiKey, platform, version }
    Edge->>API: Verify Token / API Key
    API-->>Edge: User Profile (userId, email)
    Edge-->>Agent: AUTH_ACK { sessionId, userId }
    
    Agent->>Edge: TUNNEL_REGISTER_REQ { subdomain, localTargetPort, customDomain }
    Edge->>API: Reserve / Resolve Subdomain
    API-->>Edge: Tunnel Record
    Edge-->>Agent: TUNNEL_REGISTER_ACK { tunnelId, publicUrl, assignedHostnames }
```

### 2. Request & Response Multiplexing

```mermaid
sequenceDiagram
    participant Browser
    participant Edge as Edge Ingress
    participant Agent as Windows Agent
    participant LocalApp as localhost:3000

    Browser->>Edge: HTTP POST /api/data (Payload 1MB)
    Edge->>Agent: HTTP_REQUEST_START { requestId: "req_123", method: "POST", path: "/api/data", headers }
    Edge->>Agent: HTTP_REQUEST_CHUNK { requestId: "req_123", chunk: "base64..." }
    Edge->>Agent: HTTP_REQUEST_END { requestId: "req_123" }

    Agent->>LocalApp: POST http://localhost:3000/api/data
    LocalApp-->>Agent: 200 OK (Stream Response)

    Agent->>Edge: HTTP_RESPONSE_START { requestId: "req_123", statusCode: 200, headers }
    Agent->>Edge: HTTP_RESPONSE_CHUNK { requestId: "req_123", chunk: "base64..." }
    Agent->>Edge: HTTP_RESPONSE_END { requestId: "req_123", durationMs: 42, bytesSent: 1048576 }

    Edge-->>Browser: 200 OK (Proxied Response Stream)
```

### 3. Health & Heartbeat

- Edge sends `HEARTBEAT_PING` every 15,000ms.
- Agent responds immediately with `HEARTBEAT_PONG`.
- If no heartbeat is received within 45,000ms, the session is terminated and cleaned up.
