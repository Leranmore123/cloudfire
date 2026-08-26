import { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { TunnelRegistry } from './tunnel-registry.js';
import { renderErrorPage } from './error-pages.js';
import { FrameCodec, MessageType, HttpResponseStartMessage, HttpResponseChunkMessage, HttpResponseEndMessage } from '../../../packages/protocol/src/index.js';
import { config } from '../../../packages/config/src/index.js';

export class EdgeHttpRouter {
  private registry = TunnelRegistry.getInstance();

  public async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const hostHeader = req.headers.host || '';
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    // Direct /health or edge status check
    if (req.url === '/health' || req.url === '/_edge/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'turnal-edge',
        activeTunnels: this.registry.getAllActiveSessions().length,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (!hostHeader) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(renderErrorPage(400, 'Bad Request', 'Missing Host header.', hostHeader));
      return;
    }

    // Resolve Host to Tunnel Session
    const { session, tunnelInfo, isOffline } = await this.registry.resolveHost(hostHeader);

    if (isOffline) {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end(renderErrorPage(
        503,
        'Tunnel Offline',
        `The tunnel for <strong>${hostHeader}</strong> is configured, but no tunnel agent is currently connected.`,
        hostHeader,
        'Start your Turnal Agent with: <code>turnal tunnel --port &lt;port&gt;</code>'
      ));
      return;
    }

    if (!session) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(renderErrorPage(
        404,
        'Tunnel Not Found',
        `No tunnel route is registered for host <strong>${hostHeader}</strong>.`,
        hostHeader,
        'Please check your subdomain or custom domain configuration in the Turnal dashboard.'
      ));
      return;
    }

    // Prepare Request Metadata
    const method = req.method || 'GET';
    const url = req.url || '/';
    const headers: Record<string, string | string[] | undefined> = { ...req.headers };
    
    // Set standard proxy headers
    headers['x-forwarded-for'] = clientIp;
    headers['x-forwarded-proto'] = 'http'; // or https
    headers['x-forwarded-host'] = hostHeader;
    headers['x-turnal-request-id'] = requestId;

    let totalBytesIn = 0;
    let totalBytesOut = 0;
    let responseSent = false;

    // Send HTTP_REQUEST_START to Agent
    session.sendMessage({
      type: MessageType.HTTP_REQUEST_START,
      requestId,
      method,
      url,
      path: url,
      headers,
      clientIp,
      isTls: false,
      timestamp: Date.now()
    });

    // Stream Incoming Request Body to Agent
    req.on('data', (chunk: Buffer) => {
      totalBytesIn += chunk.length;
      session.sendMessage({
        type: MessageType.HTTP_REQUEST_CHUNK,
        requestId,
        chunk: FrameCodec.bufferToBase64(chunk),
        isBinary: true,
        timestamp: Date.now()
      });
    });

    req.on('end', () => {
      session.sendMessage({
        type: MessageType.HTTP_REQUEST_END,
        requestId,
        timestamp: Date.now()
      });
    });

    req.on('error', (err) => {
      console.error(`[EdgeRouter ${requestId}] Error reading client request:`, err);
      session.multiplexer.cancelRequest(requestId, 'Client aborted request');
    });

    // Register with Session Multiplexer for Agent's Response
    session.multiplexer.registerRequest(requestId, {
      onStart: (startMsg: HttpResponseStartMessage) => {
        if (responseSent) return;
        responseSent = true;

        // Clean headers
        const resHeaders: Record<string, string | string[] | undefined> = {};
        for (const [k, v] of Object.entries(startMsg.headers || {})) {
          if (k.toLowerCase() === 'transfer-encoding') continue; // let Node handle chunked encoding
          resHeaders[k] = v as any;
        }

        res.writeHead(startMsg.statusCode || 200, resHeaders as any);
      },

      onChunk: (chunkMsg: HttpResponseChunkMessage) => {
        if (!responseSent) {
          responseSent = true;
          res.writeHead(200);
        }
        const buf = FrameCodec.base64ToBuffer(chunkMsg.chunk);
        totalBytesOut += buf.length;
        res.write(buf);
      },

      onEnd: (endMsg: HttpResponseEndMessage) => {
        if (!responseSent) {
          responseSent = true;
          res.writeHead(200);
        }
        res.end();

        const durationMs = Date.now() - startTime;
        // Asynchronously post telemetry to API
        this.ingestTelemetry({
          tunnelId: session.tunnelId,
          requestId,
          method,
          path: url,
          statusCode: res.statusCode,
          durationMs,
          bytesIn: totalBytesIn,
          bytesOut: totalBytesOut,
          clientIp,
          userAgent: req.headers['user-agent']
        });
      },

      onError: (err: Error) => {
        if (!responseSent) {
          responseSent = true;
          res.writeHead(504, { 'Content-Type': 'text/html' });
          res.end(renderErrorPage(
            504,
            'Gateway Timeout',
            'The local tunnel agent took too long to respond.',
            hostHeader,
            err.message
          ));
        } else {
          res.end();
        }

        const durationMs = Date.now() - startTime;
        this.ingestTelemetry({
          tunnelId: session.tunnelId,
          requestId,
          method,
          path: url,
          statusCode: 504,
          durationMs,
          bytesIn: totalBytesIn,
          bytesOut: totalBytesOut,
          clientIp,
          userAgent: req.headers['user-agent']
        });
      }
    });
  }

  private async ingestTelemetry(data: any): Promise<void> {
    try {
      await fetch(`${config.api.url}/api/analytics/ingest-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch {
      // Ignore telemetry transport errors
    }
  }
}
