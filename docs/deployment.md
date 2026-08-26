# 🚀 Production Deployment Architecture

## Production Topology

```
                  Internet / DNS
                        ↓
             Cloudflare / AWS ALB / Nginx
           (TLS Termination & Wildcard SSL)
                        ↓
     ┌──────────────────┴──────────────────┐
     ↓                                     ↓
Turnal API (:4000)                Turnal Edge Ingress (:8080)
     ↓                                     ↓
PostgreSQL & Redis Cache          Persistent Agent WebSockets
```

---

## Deploy with Docker Compose

1. Clone repository to your production Linux / Windows VPS:
```bash
git clone <repo-url> /opt/turnal
cd /opt/turnal
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your domain name and secrets
```

3. Launch services:
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d --build
```

4. Verify service health:
- `http://api.yourdomain.com/health`
- `http://edge.yourdomain.com/health`
