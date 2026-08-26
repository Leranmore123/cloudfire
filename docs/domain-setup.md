# 🌐 Custom Domain & DNS Configuration Guide

## How Custom Domains Work

When you link your own domain (e.g. `app.example.com` or `dev.company.org`), Turnal routes incoming traffic destined for that domain to your local machine.

---

## 3-Step Verification Process

### Step 1: Add Domain in Dashboard
1. Open the Turnal Dashboard at [http://localhost:3000/domains](http://localhost:3000/domains).
2. Click **Add Custom Domain**.
3. Enter your domain name (e.g., `app.example.com`) and select the target tunnel.

### Step 2: Configure DNS Records at your DNS Registrar
Create two DNS records:

| Type | Host / Name | Target / Value | Purpose |
|------|-------------|----------------|---------|
| **TXT** | `_turnal-challenge.app.example.com` | `turnal-verification=<TOKEN>` | Cryptographic ownership proof |
| **CNAME**| `app.example.com` | `edge.turnal.live` | Traffic routing to Edge gateway |

### Step 3: Verify Ownership
In the Turnal Dashboard, click **Verify DNS**. Once verified, traffic for that domain is immediately forwarded to your local development server.
