import { TunnelSession } from './tunnel-session.js';
import { config } from '@turnal/config';

export class TunnelRegistry {
  private static instance: TunnelRegistry;

  private sessionsBySubdomain: Map<string, TunnelSession> = new Map();
  private sessionsByCustomDomain: Map<string, TunnelSession> = new Map();
  private sessionsByTunnelId: Map<string, TunnelSession> = new Map();

  private constructor() {}

  public static getInstance(): TunnelRegistry {
    if (!TunnelRegistry.instance) {
      TunnelRegistry.instance = new TunnelRegistry();
    }
    return TunnelRegistry.instance;
  }

  public register(session: TunnelSession): void {
    const cleanSubdomain = session.subdomain.toLowerCase().trim();
    this.unregister(session.tunnelId);

    this.sessionsBySubdomain.set(cleanSubdomain, session);
    this.sessionsByTunnelId.set(session.tunnelId, session);

    if (session.customDomain) {
      this.sessionsByCustomDomain.set(session.customDomain.toLowerCase().trim(), session);
    }

    console.log(`[TunnelRegistry] Registered active session for subdomain '${cleanSubdomain}' (Tunnel ID: ${session.tunnelId})`);
  }

  public unregister(tunnelId: string): void {
    const existing = this.sessionsByTunnelId.get(tunnelId);
    if (existing) {
      existing.cleanup();
      this.sessionsBySubdomain.delete(existing.subdomain.toLowerCase().trim());
      this.sessionsByTunnelId.delete(tunnelId);
      if (existing.customDomain) {
        this.sessionsByCustomDomain.delete(existing.customDomain.toLowerCase().trim());
      }
      console.log(`[TunnelRegistry] Unregistered session for Tunnel ID ${tunnelId}`);
    }
  }

  public getBySubdomain(subdomain: string): TunnelSession | undefined {
    return this.sessionsBySubdomain.get(subdomain.toLowerCase().trim());
  }

  public getByCustomDomain(domain: string): TunnelSession | undefined {
    return this.sessionsByCustomDomain.get(domain.toLowerCase().trim());
  }

  public getByTunnelId(tunnelId: string): TunnelSession | undefined {
    return this.sessionsByTunnelId.get(tunnelId);
  }

  public async resolveHost(hostHeader: string): Promise<{ session?: TunnelSession; tunnelInfo?: any; isOffline: boolean }> {
    const cleanHost = hostHeader.split(':')[0].toLowerCase().trim();

    // 1. Check Subdomain Match: *.turnal.live or *.localhost
    let subdomain: string | null = null;
    if (cleanHost.endsWith(`.${config.baseDomain}`)) {
      subdomain = cleanHost.replace(`.${config.baseDomain}`, '');
    } else if (cleanHost.endsWith('.localhost')) {
      subdomain = cleanHost.replace('.localhost', '');
    }

    if (subdomain) {
      const liveSession = this.getBySubdomain(subdomain);
      if (liveSession) {
        return { session: liveSession, isOffline: false };
      }
    } else {
      // 2. Check Custom Domain Match
      const liveSession = this.getByCustomDomain(cleanHost);
      if (liveSession) {
        return { session: liveSession, isOffline: false };
      }
    }

    // 3. Fallback: If accessed via Local Network IP (e.g. 192.168.x.x or 127.0.0.1 or localhost)
    const activeSessions = this.getAllActiveSessions();
    if (activeSessions.length === 1 && (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost.startsWith('192.168.') || cleanHost.startsWith('10.') || cleanHost.startsWith('172.'))) {
      return { session: activeSessions[0], isOffline: false };
    }

    // 4. Query API for offline registered tunnel state
    try {
      const res = await fetch(`${config.api.url}/api/tunnels/resolve-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: cleanHost })
      });

      if (res.ok) {
        const body: any = await res.json();
        if (body.success && body.data) {
          return { tunnelInfo: body.data, isOffline: true };
        }
      }
    } catch (err) {
      console.error(`[TunnelRegistry] Error querying API to resolve host '${cleanHost}':`, err);
    }

    return { isOffline: false };
  }

  public getAllActiveSessions(): TunnelSession[] {
    return Array.from(this.sessionsByTunnelId.values());
  }
}
