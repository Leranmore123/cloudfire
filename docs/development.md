# 🛠 Local Development & Environment Setup

## Prerequisites

- **Node.js**: v20+ or v22+
- **NPM**: v10+
- **Go** (Optional, for compiling the native Go binary): 1.22+

---

## Step 1: Install Monorepo Dependencies

From the workspace root directory:

```powershell
npm install
```

---

## Step 2: Database Initialization

Initialize the SQLite development database schema:

```powershell
npm run prisma:migrate
```

---

## Step 3: Run Services Concurrently

Run the API, Edge Server, Dashboard, and Packages in development watch mode:

```powershell
npm run dev
```

Or run individual services in separate terminals:

```powershell
# Terminal 1: Backend API (Port 4000)
npm run dev:api

# Terminal 2: Edge Ingress Proxy (Port 8080)
npm run dev:edge

# Terminal 3: SaaS Dashboard (Port 3000)
npm run dev:dashboard
```

---

## Step 4: Run Tunnel Agent

### Option A: TypeScript CLI Agent (Instant, no Go installation needed)
```powershell
# Authenticate
npm run dev:agent -- login

# Expose your local port (e.g. 3000)
npm run dev:agent -- tunnel --port 3000
```

### Option B: Pure Go Standalone Agent
```powershell
cd apps/tunnel-agent/go
go run main.go login
go run main.go tunnel --port 3000
```
