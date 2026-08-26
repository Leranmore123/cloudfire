"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const index_js_1 = require("../../shared/src/index.js");
// Load .env from workspace root if available
dotenv_1.default.config();
function loadConfig() {
    const env = process.env.NODE_ENV || 'development';
    const isDev = env === 'development';
    const baseDomain = process.env.BASE_DOMAIN || index_js_1.DEFAULT_BASE_DOMAIN;
    const publicProtocol = process.env.PUBLIC_PROTOCOL || (isDev ? 'http' : 'https');
    const apiPort = parseInt(process.env.API_PORT || String(index_js_1.DEFAULT_API_PORT), 10);
    const edgePort = parseInt(process.env.EDGE_PORT || String(index_js_1.DEFAULT_EDGE_PORT), 10);
    const dashboardPort = parseInt(process.env.DASHBOARD_PORT || String(index_js_1.DEFAULT_DASHBOARD_PORT), 10);
    return {
        env,
        isDev,
        baseDomain,
        publicProtocol,
        api: {
            port: apiPort,
            host: process.env.API_HOST || '0.0.0.0',
            url: process.env.API_URL || `http://localhost:${apiPort}`,
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
exports.config = loadConfig();
//# sourceMappingURL=index.js.map