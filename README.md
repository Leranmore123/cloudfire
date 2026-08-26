# 🌐 Turnal Platform

> **Independent, High-Performance Local-to-Public Tunneling Platform**  
> Conceptual alternative to Cloudflare Tunnel / ngrok with zero proprietary tunnel dependencies.

---

## 🚀 Overview

**Turnal** enables applications running locally on your Windows PC (e.g., `localhost:3000`, `5000`, `8000`) to become immediately accessible through public subdomains or custom domains (e.g., `https://myapp.turnal.live` or `https://app.yourdomain.com`).

```
Browser / Client
      ↓ (Public HTTPS Request)
Turnal Edge Ingress (:8080)
      ↓ (Multiplexed Outbound WebSocket Tunnel)
Turnal Tunnel Agent (Windows / Go / Node CLI)
      ↓ (HTTP Proxy)
Local Application (http://localhost:3000)
```

---

## ✨ Features

- **🛡 Zero Inbound Firewall Opening**: Outbound persistent TLS stream to the Edge server.
- **⚡ Original Multiplexed Wire Protocol**: Streams concurrent requests, binary chunks, headers, WebSockets, and heartbeats over a single socket without head-of-line blocking.
- **💻 Dual Agent Implementations**:
  - **Go Tunnel Agent**: Pure native binary for Windows, Linux, macOS.
  - **TypeScript CLI Agent**: Instant zero-compilation execution (`npm run dev:agent`).
- **🌐 Custom Domains & DNS Challenge**: Add custom domains with automated TXT challenge verification and CNAME routing.
- **📊 Real-time SaaS Dashboard**: Next.js 14 dark-mode UI with live tunnels, real-time request log inspector, bandwidth metrics, latency charts, and API key management.
- **🔒 Enterprise Security**: bcrypt password hashing, JWT sessions, SHA-256 hashed API keys, device fingerprinting, and rate limiting.

---

## 📁 Repository Structure

```
TURNAL/
├── apps/
│   ├── api/            # Express/NestJS backend + Prisma ORM (Port 4000)
│   ├── edge/           # High-throughput Edge Ingress Proxy (Port 8080)
│   ├── dashboard/      # Next.js 14 SaaS UI (Port 3000)
│   └── tunnel-agent/   # Windows / Cross-Platform Tunnel Agents
│       ├── ts/         # TypeScript CLI Agent
│       └── go/         # Pure Go Standalone Agent
├── packages/
│   ├── protocol/       # Custom Wire Frame Codec & Stream Multiplexer
│   ├── shared/         # Shared Types, DTOs & Constants
│   ├── auth/           # Password hashing, JWT & API Key services
│   └── config/         # Centralized configuration loader
├── infrastructure/
│   ├── docker/         # docker-compose.yml & Dockerfiles
│   └── nginx/          # Production SSL & Reverse Proxy configs
├── docs/               # Architecture, Security, Protocol & Setup Guides
└── tests/              # End-to-End Automated Test Suite
```

---

## ⚡ Quick Start (Windows Local Development)

### 1. Install Dependencies & Build Packages
```powershell
npm install
npm run prisma:migrate
npm run build
```

### 2. Start Platform Services Concurrently
```powershell
npm run dev
```
- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000](http://localhost:4000)
- **Edge Ingress**: [http://localhost:8080](http://localhost:8080)

### 3. Authenticate & Start Tunnel Agent
```powershell
# Authenticate CLI
npm run dev:agent -- login

# Expose your local port (e.g. localhost:3000)
npm run dev:agent -- tunnel --port 3000
```

---

## 🧪 Automated End-to-End Verification

Run the automated end-to-end test verifying:
`Client Request -> Edge Server -> Multiplexed Tunnel -> Windows Agent -> Local Mock Server -> HTTP Response`:

```powershell
npm run test:e2e
```

---

## 📖 Documentation

- [Architecture Guide](docs/architecture.md)
- [Development Setup](docs/development.md)
- [Wire Protocol Specification](docs/tunnel-protocol.md)
- [Security & Authentication](docs/security.md)
- [Custom Domain & DNS Setup](docs/domain-setup.md)
- [Agent CLI Reference](docs/agent.md)
- [Production Deployment](docs/deployment.md)
