# 💻 Turnal Agent CLI Reference

## Available Commands

### 1. `turnal login`
Authenticates the CLI agent against your Turnal account and stores credentials in `~/.turnal/config.json`.

```powershell
turnal login
# Or with direct API key
turnal login --api-key trk_live_xxxxxxxx
```

### 2. `turnal status`
Displays the current authentication state and active user credentials.

```powershell
turnal status
```

### 3. `turnal tunnel`
Starts a persistent multiplexed tunnel exposing a local port to the internet.

```powershell
# Expose port 3000
turnal tunnel --port 3000

# Expose port 5000 with a custom subdomain
turnal tunnel --port 5000 --subdomain my-fastapi-backend

# Expose a custom verified domain
turnal tunnel --port 8000 --domain api.example.com
```

### 4. `turnal logout`
Clears stored session tokens and API keys from the local machine.

```powershell
turnal logout
```
