import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_BASE_DOMAIN,
  DEFAULT_API_PORT,
  DEFAULT_EDGE_PORT,
  DEFAULT_DASHBOARD_PORT
} from '@turnal/shared';

// Load .env if present using native Node loader or simple parser
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile();
  } else {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.trim();
          }
        }
      }
    }
  }
} catch {}

export interface TurnalConfig {
  env: 'development' | 'production' | 'test';
  isDev: boolean;
  baseDomain: string;
  publicProtocol: 'http' | 'https';
  
  api: {
    port: number;
    host: string;
    url: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
  };

  database: {
    url: string;
  };

  redis: {
    url?: string;
  };

  edge: {
    port: number;
    host: string;
    publicUrl: string;
    wsPath: string;
    wildcardDomain: string;
  };

  dashboard: {
    port: number;
  };
}

export function loadConfig(): TurnalConfig {
  const env = (process.env.NODE_ENV as any) || 'development';
  const isDev = env === 'development';
  const baseDomain = process.env.BASE_DOMAIN || DEFAULT_BASE_DOMAIN;
  const publicProtocol = (process.env.PUBLIC_PROTOCOL as any) || (isDev ? 'http' : 'https');

  const apiPort = parseInt(process.env.API_PORT || String(DEFAULT_API_PORT), 10);
  const edgePort = parseInt(process.env.EDGE_PORT || String(DEFAULT_EDGE_PORT), 10);
  const dashboardPort = parseInt(process.env.DASHBOARD_PORT || String(DEFAULT_DASHBOARD_PORT), 10);

  return {
    env,
    isDev,
    baseDomain,
    publicProtocol,
    api: {
      port: apiPort,
      host: process.env.API_HOST || '0.0.0.0',
      url: process.env.API_URL || `http://127.0.0.1:${apiPort}`,
      jwtSecret: process.env.JWT_SECRET || 'turnal-dev-secret-key-32-chars-min-length-required',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'turnal-dev-refresh-secret-key-32-chars',
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },
    database: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    },
    redis: {
      url: process.env.REDIS_URL
    },
    edge: {
      port: edgePort,
      host: process.env.EDGE_HOST || '0.0.0.0',
      publicUrl: process.env.EDGE_PUBLIC_URL || `http://localhost:${edgePort}`,
      wsPath: process.env.EDGE_TUNNEL_WS_PATH || '/tunnel/connect',
      wildcardDomain: process.env.EDGE_WILDCARD_DOMAIN || '.localhost'
    },
    dashboard: {
      port: dashboardPort
    }
  };
}

export const config = loadConfig();
