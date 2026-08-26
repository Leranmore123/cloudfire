#!/usr/bin/env node
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

var require_messages = __commonJS({
  "packages/protocol/src/messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessageType = void 0;
    var MessageType3;
    (function(MessageType4) {
      MessageType4["AUTH_REQ"] = "AUTH_REQ";
      MessageType4["AUTH_ACK"] = "AUTH_ACK";
      MessageType4["AUTH_FAIL"] = "AUTH_FAIL";
      MessageType4["TUNNEL_REGISTER_REQ"] = "TUNNEL_REGISTER_REQ";
      MessageType4["TUNNEL_REGISTER_ACK"] = "TUNNEL_REGISTER_ACK";
      MessageType4["TUNNEL_REGISTER_FAIL"] = "TUNNEL_REGISTER_FAIL";
      MessageType4["TUNNEL_CLOSE"] = "TUNNEL_CLOSE";
      MessageType4["HTTP_REQUEST_START"] = "HTTP_REQUEST_START";
      MessageType4["HTTP_REQUEST_CHUNK"] = "HTTP_REQUEST_CHUNK";
      MessageType4["HTTP_REQUEST_END"] = "HTTP_REQUEST_END";
      MessageType4["HTTP_RESPONSE_START"] = "HTTP_RESPONSE_START";
      MessageType4["HTTP_RESPONSE_CHUNK"] = "HTTP_RESPONSE_CHUNK";
      MessageType4["HTTP_RESPONSE_END"] = "HTTP_RESPONSE_END";
      MessageType4["WS_OPEN"] = "WS_OPEN";
      MessageType4["WS_FRAME"] = "WS_FRAME";
      MessageType4["WS_CLOSE"] = "WS_CLOSE";
      MessageType4["HEARTBEAT_PING"] = "HEARTBEAT_PING";
      MessageType4["HEARTBEAT_PONG"] = "HEARTBEAT_PONG";
      MessageType4["ERROR"] = "ERROR";
    })(MessageType3 || (exports.MessageType = MessageType3 = {}));
  }
});

var require_codec = __commonJS({
  "packages/protocol/src/codec.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FrameCodec = void 0;
    var FrameCodec3 = class {
      static encode(message) {
        return JSON.stringify(message);
      }
      static decode(raw) {
        const text = typeof raw === "string" ? raw : Buffer.isBuffer(raw) ? raw.toString("utf8") : Buffer.from(raw).toString("utf8");
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || !parsed.type) {
          throw new Error("Invalid wire protocol frame: missing message type");
        }
        return parsed;
      }
      static bufferToBase64(buf) {
        return Buffer.from(buf).toString("base64");
      }
      static base64ToBuffer(b64) {
        return Buffer.from(b64, "base64");
      }
    };
    exports.FrameCodec = FrameCodec3;
  }
});

var require_multiplexer = __commonJS({
  "packages/protocol/src/multiplexer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StreamMultiplexer = void 0;
    var node_events_1 = __require("node:events");
    var messages_js_1 = require_messages();
    var StreamMultiplexer = class extends node_events_1.EventEmitter {
      inFlightRequests = /* @__PURE__ */ new Map();
      defaultTimeoutMs;
      constructor(defaultTimeoutMs = 6e4) {
        super();
        this.defaultTimeoutMs = defaultTimeoutMs;
      }
      registerRequest(requestId, callbacks, timeoutMs) {
        const timeout = timeoutMs || this.defaultTimeoutMs;
        const timer = setTimeout(() => {
          this.handleTimeout(requestId);
        }, timeout);
        this.inFlightRequests.set(requestId, {
          requestId,
          ...callbacks,
          timeoutTimer: timer,
          startedAt: Date.now()
        });
      }
      routeIncomingMessage(msg) {
        switch (msg.type) {
          case messages_js_1.MessageType.HTTP_RESPONSE_START: {
            const req = this.inFlightRequests.get(msg.requestId);
            if (req && req.onStart) {
              req.onStart(msg);
              return true;
            }
            return false;
          }
          case messages_js_1.MessageType.HTTP_RESPONSE_CHUNK: {
            const req = this.inFlightRequests.get(msg.requestId);
            if (req && req.onChunk) {
              req.onChunk(msg);
              return true;
            }
            return false;
          }
          case messages_js_1.MessageType.HTTP_RESPONSE_END: {
            const req = this.inFlightRequests.get(msg.requestId);
            if (req) {
              clearTimeout(req.timeoutTimer);
              if (req.onEnd) {
                req.onEnd(msg);
              }
              this.inFlightRequests.delete(msg.requestId);
              return true;
            }
            return false;
          }
          case messages_js_1.MessageType.ERROR: {
            if (msg.requestId) {
              const req = this.inFlightRequests.get(msg.requestId);
              if (req) {
                clearTimeout(req.timeoutTimer);
                if (req.onError) {
                  req.onError(new Error(`Remote agent error [${msg.code}]: ${msg.message}`));
                }
                this.inFlightRequests.delete(msg.requestId);
                return true;
              }
            }
            return false;
          }
          default:
            return false;
        }
      }
      cancelRequest(requestId, reason = "Request cancelled") {
        const req = this.inFlightRequests.get(requestId);
        if (req) {
          clearTimeout(req.timeoutTimer);
          if (req.onError) {
            req.onError(new Error(reason));
          }
          this.inFlightRequests.delete(requestId);
        }
      }
      closeAll(reason = "Tunnel connection closed") {
        for (const [id, req] of this.inFlightRequests.entries()) {
          clearTimeout(req.timeoutTimer);
          if (req.onError) {
            req.onError(new Error(reason));
          }
        }
        this.inFlightRequests.clear();
      }
      getInFlightCount() {
        return this.inFlightRequests.size;
      }
      handleTimeout(requestId) {
        const req = this.inFlightRequests.get(requestId);
        if (req) {
          this.inFlightRequests.delete(requestId);
          if (req.onError) {
            req.onError(new Error(`Tunnel gateway timeout: no response from agent within ${this.defaultTimeoutMs}ms`));
          }
        }
      }
    };
    exports.StreamMultiplexer = StreamMultiplexer;
  }
});

var require_src = __commonJS({
  "packages/protocol/src/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_messages(), exports);
    __exportStar(require_codec(), exports);
    __exportStar(require_multiplexer(), exports);
  }
});

var require_types = __commonJS({
  "packages/shared/src/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SslStatus = exports.DomainVerificationStatus = exports.TunnelStatus = void 0;
    var TunnelStatus;
    (function(TunnelStatus2) {
      TunnelStatus2["OFFLINE"] = "OFFLINE";
      TunnelStatus2["ONLINE"] = "ONLINE";
      TunnelStatus2["CONNECTING"] = "CONNECTING";
      TunnelStatus2["ERROR"] = "ERROR";
      TunnelStatus2["DISABLED"] = "DISABLED";
    })(TunnelStatus || (exports.TunnelStatus = TunnelStatus = {}));
    var DomainVerificationStatus;
    (function(DomainVerificationStatus2) {
      DomainVerificationStatus2["PENDING"] = "PENDING";
      DomainVerificationStatus2["VERIFIED"] = "VERIFIED";
      DomainVerificationStatus2["FAILED"] = "FAILED";
    })(DomainVerificationStatus || (exports.DomainVerificationStatus = DomainVerificationStatus = {}));
    var SslStatus;
    (function(SslStatus2) {
      SslStatus2["NONE"] = "NONE";
      SslStatus2["PENDING"] = "PENDING";
      SslStatus2["ACTIVE"] = "ACTIVE";
      SslStatus2["ERROR"] = "ERROR";
    })(SslStatus || (exports.SslStatus = SslStatus = {}));
  }
});

var require_constants = __commonJS({
  "packages/shared/src/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HEARTBEAT_TIMEOUT_MS = exports.HEARTBEAT_INTERVAL_MS = exports.TUNNEL_TIMEOUT_MS = exports.DNS_CNAME_TARGET = exports.DNS_TXT_PREFIX = exports.DEVICE_TOKEN_PREFIX = exports.API_KEY_PREFIX = exports.DEFAULT_DASHBOARD_PORT = exports.DEFAULT_EDGE_PORT = exports.DEFAULT_API_PORT = exports.DEFAULT_BASE_DOMAIN = exports.PLATFORM_NAME = void 0;
    exports.PLATFORM_NAME = "Turnal";
    exports.DEFAULT_BASE_DOMAIN = "turnal.live";
    exports.DEFAULT_API_PORT = 4e3;
    exports.DEFAULT_EDGE_PORT = 8080;
    exports.DEFAULT_DASHBOARD_PORT = 3e3;
    exports.API_KEY_PREFIX = "trk_live_";
    exports.DEVICE_TOKEN_PREFIX = "dev_tok_";
    exports.DNS_TXT_PREFIX = "_turnal-challenge.";
    exports.DNS_CNAME_TARGET = "edge.turnal.live";
    exports.TUNNEL_TIMEOUT_MS = 3e4;
    exports.HEARTBEAT_INTERVAL_MS = 15e3;
    exports.HEARTBEAT_TIMEOUT_MS = 45e3;
  }
});

var require_dto = __commonJS({
  "packages/shared/src/dto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

import { Command } from "commander";
import chalk from "chalk";
import readline from "node:readline/promises";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
var ConfigStore = class _ConfigStore {
  static configDir = path.join(os.homedir(), ".turnal");
  static configFile = path.join(_ConfigStore.configDir, "config.json");
  static load() {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, "utf8");
        return JSON.parse(raw);
      }
    } catch (e) {
    }
    return {};
  }
  static save(config2) {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      const existing = this.load();
      const updated = { ...existing, ...config2 };
      fs.writeFileSync(this.configFile, JSON.stringify(updated, null, 2), "utf8");
      return updated;
    } catch (e) {
      console.error("Failed to save config to disk:", e);
      return {};
    }
  }
  static clear() {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
      }
    } catch (e) {
    }
  }
};

var import_src2 = __toESM(require_src());
import { WebSocket } from "ws";
import { EventEmitter } from "node:events";

var import_src = __toESM(require_src());
import http from "node:http";
import https from "node:https";
var LocalForwarder = class {
  localPort;
  localHost;
  protocol;
  activeLocalRequests = /* @__PURE__ */ new Map();
  constructor(localPort, localHost = "localhost", protocol = "http") {
    this.localPort = localPort;
    this.localHost = localHost;
    this.protocol = protocol;
  }
  handleRequestStart(msg, sendFrame) {
    const startTime = Date.now();
    const clientModule = this.protocol === "https" ? https : http;
    const headers = { ...msg.headers };
    headers.host = `${this.localHost}:${this.localPort}`;
    const options = {
      hostname: this.localHost,
      port: this.localPort,
      path: msg.path || "/",
      method: msg.method || "GET",
      headers,
      timeout: 3e4
    };
    const localReq = clientModule.request(options, (localRes) => {
      let bytesSent = 0;
      sendFrame({
        type: import_src.MessageType.HTTP_RESPONSE_START,
        requestId: msg.requestId,
        statusCode: localRes.statusCode || 200,
        statusMessage: localRes.statusMessage,
        headers: localRes.headers,
        timestamp: Date.now()
      });
      localRes.on("data", (chunk) => {
        bytesSent += chunk.length;
        sendFrame({
          type: import_src.MessageType.HTTP_RESPONSE_CHUNK,
          requestId: msg.requestId,
          chunk: import_src.FrameCodec.bufferToBase64(chunk),
          isBinary: true,
          timestamp: Date.now()
        });
      });
      localRes.on("end", () => {
        this.activeLocalRequests.delete(msg.requestId);
        sendFrame({
          type: import_src.MessageType.HTTP_RESPONSE_END,
          requestId: msg.requestId,
          durationMs: Date.now() - startTime,
          bytesSent,
          timestamp: Date.now()
        });
      });
    });
    localReq.on("error", (err) => {
      this.activeLocalRequests.delete(msg.requestId);
      console.error(`[LocalForwarder] Error connecting to ${this.localHost}:${this.localPort}:`, err.message);
      sendFrame({
        type: import_src.MessageType.ERROR,
        requestId: msg.requestId,
        code: "LOCAL_CONNECTION_REFUSED",
        message: `Failed to connect to local application at http://${this.localHost}:${this.localPort}. Is your local server running?`,
        timestamp: Date.now()
      });
    });
    this.activeLocalRequests.set(msg.requestId, localReq);
  }
  handleRequestChunk(msg) {
    const localReq = this.activeLocalRequests.get(msg.requestId);
    if (localReq && !localReq.destroyed) {
      const buf = import_src.FrameCodec.base64ToBuffer(msg.chunk);
      localReq.write(buf);
    }
  }
  handleRequestEnd(requestId) {
    const localReq = this.activeLocalRequests.get(requestId);
    if (localReq && !localReq.destroyed) {
      localReq.end();
    }
  }
  abortRequest(requestId) {
    const localReq = this.activeLocalRequests.get(requestId);
    if (localReq) {
      localReq.destroy();
      this.activeLocalRequests.delete(requestId);
    }
  }
};

var TunnelClient = class extends EventEmitter {
  options;
  ws = null;
  forwarder;
  isStopping = false;
  reconnectAttempts = 0;
  reconnectTimer;
  publicUrl;
  subdomain;
  tunnelId;
  constructor(options) {
    super();
    this.options = {
      localHost: "localhost",
      ...options
    };
    this.forwarder = new LocalForwarder(
      this.options.localPort,
      this.options.localHost,
      "http"
    );
  }
  async start() {
    this.isStopping = false;
    this.connect();
  }
  stop() {
    this.isStopping = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emit("stopped");
  }
  connect() {
    if (this.isStopping) return;
    this.emit("connecting", { attempt: this.reconnectAttempts + 1, url: this.options.edgeWsUrl });
    try {
      const hostHeader = this.options.customDomain || (this.options.subdomain ? `${this.options.subdomain}.skyranksolution.com` : "app.skyranksolution.com");
      this.ws = new WebSocket(this.options.edgeWsUrl, {
        headers: {
          "host": hostHeader
        }
      });
    } catch (err) {
      this.handleDisconnect(`Failed to create WebSocket: ${err.message}`);
      return;
    }
    this.ws.on("open", () => {
      this.reconnectAttempts = 0;
      this.emit("connected");
      this.sendHandshake();
    });
    this.ws.on("message", (raw) => {
      try {
        const msg = import_src2.FrameCodec.decode(raw);
        this.handleMessage(msg);
      } catch (err) {
        console.error("[TunnelClient] Error decoding incoming frame:", err);
      }
    });
    this.ws.on("close", (code, reason) => {
      this.handleDisconnect(`Connection closed (${code}): ${reason.toString() || "Remote server closed stream"}`);
    });
    this.ws.on("error", (err) => {
      this.handleDisconnect(`Socket error: ${err.message}`);
    });
  }
  sendHandshake() {
    this.send({
      type: import_src2.MessageType.AUTH_REQ,
      token: this.options.token,
      apiKey: this.options.apiKey,
      agentVersion: "1.0.0",
      platform: process.platform,
      deviceName: process.env.COMPUTERNAME || process.env.HOSTNAME || "agent-device",
      timestamp: Date.now()
    });
  }
  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(import_src2.FrameCodec.encode(msg));
    }
  }
  handleMessage(msg) {
    switch (msg.type) {
      case import_src2.MessageType.AUTH_ACK:
        this.emit("authenticated", msg);
        this.send({
          type: import_src2.MessageType.TUNNEL_REGISTER_REQ,
          projectName: this.options.projectName,
          subdomain: this.options.subdomain,
          customDomain: this.options.customDomain,
          localTargetPort: this.options.localPort,
          localTargetHost: this.options.localHost,
          protocol: "http",
          timestamp: Date.now()
        });
        break;
      case import_src2.MessageType.AUTH_FAIL:
        this.emit("error", new Error(`Authentication failed: ${msg.reason}`));
        this.stop();
        break;
      case import_src2.MessageType.TUNNEL_REGISTER_ACK: {
        const ack = msg;
        this.tunnelId = ack.tunnelId;
        this.subdomain = ack.subdomain;
        this.publicUrl = ack.publicUrl;
        this.emit("ready", ack);
        break;
      }
      case import_src2.MessageType.TUNNEL_REGISTER_FAIL:
        this.emit("error", new Error(`Tunnel registration failed: ${msg.reason}`));
        this.stop();
        break;
      case import_src2.MessageType.HTTP_REQUEST_START:
        this.emit("request", {
          id: msg.requestId,
          method: msg.method,
          path: msg.path
        });
        this.forwarder.handleRequestStart(msg, (frame) => this.send(frame));
        break;
      case import_src2.MessageType.HTTP_REQUEST_CHUNK:
        this.forwarder.handleRequestChunk(msg);
        break;
      case import_src2.MessageType.HTTP_REQUEST_END:
        this.forwarder.handleRequestEnd(msg.requestId);
        break;
      case import_src2.MessageType.HEARTBEAT_PING:
        this.send({
          type: import_src2.MessageType.HEARTBEAT_PONG,
          sequence: msg.sequence,
          timestamp: Date.now()
        });
        break;
      default:
        break;
    }
  }
  handleDisconnect(reason) {
    if (this.isStopping) return;
    this.emit("disconnected", { reason });
    const delay = Math.min(1e3 * Math.pow(1.5, this.reconnectAttempts), 15e3);
    this.reconnectAttempts++;
    this.emit("reconnecting", { delayMs: Math.round(delay), attempt: this.reconnectAttempts });
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
};

var src_exports2 = {};
__reExport(src_exports2, __toESM(require_types()));
__reExport(src_exports2, __toESM(require_constants()));
__reExport(src_exports2, __toESM(require_dto()));

var src_exports = {};
__reExport(src_exports, __toESM(require_messages()));
__reExport(src_exports, __toESM(require_codec()));
__reExport(src_exports, __toESM(require_multiplexer()));

__reExport(src_exports2, src_exports);

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  } else {
    const envPath = path2.join(process.cwd(), ".env");
    if (fs2.existsSync(envPath)) {
      const content = fs2.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...rest] = trimmed.split("=");
          const val = rest.join("=").replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.trim();
          }
        }
      }
    }
  }
} catch {
}
function loadConfig() {
  const env = process.env.NODE_ENV || "development";
  const isDev = env === "development";
  const baseDomain = process.env.BASE_DOMAIN || src_exports2.DEFAULT_BASE_DOMAIN;
  const publicProtocol = process.env.PUBLIC_PROTOCOL || (isDev ? "http" : "https");
  const apiPort = parseInt(process.env.API_PORT || String(src_exports2.DEFAULT_API_PORT), 10);
  const edgePort = parseInt(process.env.EDGE_PORT || String(src_exports2.DEFAULT_EDGE_PORT), 10);
  const dashboardPort = parseInt(process.env.DASHBOARD_PORT || String(src_exports2.DEFAULT_DASHBOARD_PORT), 10);
  return {
    env,
    isDev,
    baseDomain,
    publicProtocol,
    api: {
      port: apiPort,
      host: process.env.API_HOST || "0.0.0.0",
      url: process.env.API_URL || `http://127.0.0.1:${apiPort}`,
      jwtSecret: process.env.JWT_SECRET || "turnal-dev-secret-key-32-chars-min-length-required",
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "turnal-dev-refresh-secret-key-32-chars",
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
    },
    database: {
      url: process.env.DATABASE_URL || "file:./dev.db"
    },
    redis: {
      url: process.env.REDIS_URL
    },
    edge: {
      port: edgePort,
      host: process.env.EDGE_HOST || "0.0.0.0",
      publicUrl: process.env.EDGE_PUBLIC_URL || `http://localhost:${edgePort}`,
      wsPath: process.env.EDGE_TUNNEL_WS_PATH || "/tunnel/connect",
      wildcardDomain: process.env.EDGE_WILDCARD_DOMAIN || ".localhost"
    },
    dashboard: {
      port: dashboardPort
    }
  };
}
var config = loadConfig();

var program = new Command();
program.name("turnal").description("Turnal CLI - Secure Local-to-Public Tunneling Agent").version("1.0.0");
program.command("login").description("Authenticate your agent with Turnal platform").option("-e, --email <email>", "Account email").option("-k, --api-key <apiKey>", "Authenticate via API Key directly").option("--api-url <url>", "Override API Server URL").action(async (options) => {
  const apiUrl = options.apiUrl || config.api.url;
  if (options.apiKey) {
    ConfigStore.save({ apiKey: options.apiKey, apiUrl });
    console.log(chalk.green("\u2714 Successfully authenticated with API Key!"));
    return;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = options.email || await rl.question(chalk.cyan("Email: "));
    const password = await rl.question(chalk.cyan("Password: "));
    console.log(chalk.gray("\nAuthenticating with Turnal..."));
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Host": "app.skyranksolution.com"
      },
      body: JSON.stringify({ email: email.trim(), password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(chalk.red(`\u2716 Login failed: ${data.error?.message || "Invalid credentials"}`));
      process.exit(1);
    }
    ConfigStore.save({
      token: data.data.token,
      userEmail: data.data.user.email,
      userName: data.data.user.name,
      apiUrl
    });
    console.log(chalk.green(`\u2714 Welcome back, ${data.data.user.name}! (${data.data.user.email})`));
    console.log(chalk.gray("Your credentials have been securely stored in ~/.turnal/config.json\n"));
  } catch (err) {
    console.error(chalk.red(`\u2716 Error connecting to API: ${err.message}`));
  } finally {
    rl.close();
  }
});
program.command("logout").description("Log out and clear stored credentials").action(() => {
  ConfigStore.clear();
  console.log(chalk.green("\u2714 Successfully logged out of Turnal."));
});
program.command("status").description("Check current agent authentication state").action(() => {
  const creds = ConfigStore.load();
  if (!creds.token && !creds.apiKey) {
    console.log(chalk.yellow("Not logged in. Run: turnal login"));
    return;
  }
  console.log(chalk.bold("\nTurnal Agent Status:"));
  console.log(`  User:      ${chalk.cyan(creds.userName || "API Key User")}`);
  console.log(`  Email:     ${chalk.cyan(creds.userEmail || "N/A")}`);
  console.log(`  API URL:   ${chalk.gray(creds.apiUrl || config.api.url)}`);
  console.log(`  Auth Mode: ${chalk.green(creds.apiKey ? "API Key" : "Session Token")}\n`);
});
program.command("tunnel").description("Start a secure tunnel to expose a local port to the internet").option("-p, --port <port>", "Local port to expose (e.g. 3000)", "3000").option("-s, --subdomain <subdomain>", "Requested custom subdomain").option("-d, --domain <domain>", "Configured custom domain").option("-k, --api-key <apiKey>", "Authenticate via API Key directly").option("-t, --token <token>", "Authenticate via Session Token").option("-n, --name <name>", "Project / Tunnel name").option("--host <host>", "Local target host", "localhost").option("--edge-ws <url>", "Edge WebSocket URL override").action(async (options) => {
  const creds = ConfigStore.load();
  const token = options.token || creds.token;
  const apiKey = options.apiKey || creds.apiKey;
  if (!token && !apiKey) {
    console.log(chalk.red("\u2716 Authentication required. Pass --api-key <key> or run: turnal login"));
    process.exit(1);
  }
  const port = parseInt(options.port, 10);
  const edgeWsUrl = options.edgeWs || options.edgeWsUrl || process.env.TURNAL_EDGE_WS_URL || `ws://${config.edge.host === "0.0.0.0" ? "127.0.0.1" : config.edge.host}:${config.edge.port}${config.edge.wsPath}`;
  console.log(chalk.bold.cyan("\n  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2557   \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557     "));
  console.log(chalk.bold.cyan("  \u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     "));
  console.log(chalk.bold.cyan("     \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551     "));
  console.log(chalk.bold.cyan("     \u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u255A\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551     "));
  console.log(chalk.bold.cyan("     \u2588\u2588\u2551   \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557"));
  console.log(chalk.bold.cyan("     \u255A\u2550\u255D    \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n"));
  let reqSubdomain = options.subdomain;
  if (!reqSubdomain && options.domain) {
    if (options.domain.includes(".")) {
      reqSubdomain = options.domain.split(".")[0];
    }
  }
  const client = new TunnelClient({
    edgeWsUrl,
    token,
    apiKey,
    localPort: port,
    localHost: options.host,
    subdomain: reqSubdomain,
    customDomain: options.domain,
    projectName: options.name
  });
  client.on("connecting", ({ attempt }) => {
    console.log(chalk.yellow(`\u23F3 Connecting to Turnal Edge (attempt ${attempt})...`));
  });
  client.on("connected", () => {
    console.log(chalk.gray("\u2714 Connected to edge gateway. Authenticating..."));
  });
  client.on("authenticated", () => {
    console.log(chalk.green("\u2714 Authenticated successfully. Reserving tunnel route..."));
  });
  client.on("ready", (ack) => {
    console.log(chalk.bold.green("\n\u{1F389} TUNNEL IS ONLINE!"));
    console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    if (ack.customDomain) {
      console.log(`  ${chalk.bold("Forwarding:")}  ${chalk.cyan(`http://${ack.customDomain}`)} ${chalk.gray("\u2192")} ${chalk.yellow(`http://${ack.localTarget}`)}`);
      console.log(`  ${chalk.bold("Turnal URL:")}  ${chalk.gray(ack.publicUrl)}`);
    } else {
      console.log(`  ${chalk.bold("Forwarding:")}  ${chalk.cyan(ack.publicUrl)} ${chalk.gray("\u2192")} ${chalk.yellow(`http://${ack.localTarget}`)}`);
    }
    console.log(`  ${chalk.bold("Tunnel ID:")}   ${chalk.gray(ack.tunnelId)}`);
    console.log(`  ${chalk.bold("Status:")}      ${chalk.bgGreen.black(" LIVE ")}`);
    console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    console.log(chalk.gray("\nPress Ctrl+C to close the tunnel.\n"));
  });
  client.on("request", ({ method, path: path3 }) => {
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    console.log(`  ${chalk.gray(time)} ${chalk.bold.blue(method)} ${chalk.white(path3)}`);
  });
  client.on("disconnected", ({ reason }) => {
    console.log(chalk.red(`\n\u2716 Connection lost: ${reason}`));
  });
  client.on("reconnecting", ({ delayMs, attempt }) => {
    console.log(chalk.yellow(`\u23F3 Reconnecting in ${delayMs / 1e3}s (attempt ${attempt})...`));
  });
  client.on("error", (err) => {
    console.error(chalk.red(`\n\u2716 Tunnel error: ${err.message}`));
  });
  const shutdown = () => {
    console.log(chalk.yellow("\n\nClosing tunnel and shutting down agent..."));
    client.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await client.start();
});
program.parse(process.argv);
