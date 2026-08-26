"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEARTBEAT_TIMEOUT_MS = exports.HEARTBEAT_INTERVAL_MS = exports.TUNNEL_TIMEOUT_MS = exports.DNS_CNAME_TARGET = exports.DNS_TXT_PREFIX = exports.DEVICE_TOKEN_PREFIX = exports.API_KEY_PREFIX = exports.DEFAULT_DASHBOARD_PORT = exports.DEFAULT_EDGE_PORT = exports.DEFAULT_API_PORT = exports.DEFAULT_BASE_DOMAIN = exports.PLATFORM_NAME = void 0;
exports.PLATFORM_NAME = 'Turnal';
exports.DEFAULT_BASE_DOMAIN = 'turnal.live';
exports.DEFAULT_API_PORT = 4000;
exports.DEFAULT_EDGE_PORT = 8080;
exports.DEFAULT_DASHBOARD_PORT = 3000;
exports.API_KEY_PREFIX = 'trk_live_';
exports.DEVICE_TOKEN_PREFIX = 'dev_tok_';
exports.DNS_TXT_PREFIX = '_turnal-challenge.';
exports.DNS_CNAME_TARGET = 'edge.turnal.live';
exports.TUNNEL_TIMEOUT_MS = 30000; // 30s timeout for local proxy response
exports.HEARTBEAT_INTERVAL_MS = 15000; // 15s ping interval
exports.HEARTBEAT_TIMEOUT_MS = 45000; // 45s dead connection threshold
//# sourceMappingURL=constants.js.map