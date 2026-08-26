# 🔒 Security Architecture & Hardening

## Security Pillars

### 1. Zero Inbound Exposure
The Turnal Agent establishes an **outbound** persistent WebSocket/TLS connection to the public Edge Server.
- No public open ports on the developer's PC.
- No router port-forwarding (NAT/UPnP) needed.
- Shielded against external inbound network port scanning.

### 2. Authentication & Credential Storage
- **Password Hashing**: User passwords are encrypted with `bcrypt` using 12 salt rounds. Passwords are never stored or transmitted in plaintext.
- **Session Tokens**: JWT access tokens signed with HMAC-SHA256.
- **API Keys**: Formatted with secure prefixes (`trk_live_...`), 192 bits of entropy, and stored using one-way SHA-256 hashes in the database.
- **Sanitized Telemetry**: Passwords, API keys, and authorization headers are stripped from log streams.

### 3. Domain Ownership Verification
Custom domains require cryptographic DNS TXT record challenge verification (`_turnal-challenge.yourdomain.com`) to prevent subdomain takeover.

### 4. Rate Limiting & Protection
- Global IP rate limiting on API endpoints (1,000 requests per 15 minutes).
- Per-tunnel request concurrency limits and stream timeout guards (30s).
