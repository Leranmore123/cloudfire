export const PLATFORM_NAME = 'Turnal';
export const DEFAULT_BASE_DOMAIN = 'turnal.live';
export const DEFAULT_API_PORT = 4000;
export const DEFAULT_EDGE_PORT = 8080;
export const DEFAULT_DASHBOARD_PORT = 3000;

export const API_KEY_PREFIX = 'trk_live_';
export const DEVICE_TOKEN_PREFIX = 'dev_tok_';

export const DNS_TXT_PREFIX = '_turnal-challenge.';
export const DNS_CNAME_TARGET = 'edge.turnal.live';

export const TUNNEL_TIMEOUT_MS = 30000; // 30s timeout for local proxy response
export const HEARTBEAT_INTERVAL_MS = 15000; // 15s ping interval
export const HEARTBEAT_TIMEOUT_MS = 45000; // 45s dead connection threshold
