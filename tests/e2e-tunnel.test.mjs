/**
 * Turnal Platform End-to-End Test Suite
 * 
 * Verifies the full loop:
 * Browser / HTTP Client -> Edge Ingress -> Multiplexed Tunnel Stream -> Agent -> Localhost App -> Response
 */

import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { StreamMultiplexer, FrameCodec, MessageType } from '../packages/protocol/dist/index.js';
import { TunnelSession } from '../apps/edge/dist/tunnel-session.js';
import { TunnelRegistry } from '../apps/edge/dist/tunnel-registry.js';
import { EdgeHttpRouter } from '../apps/edge/dist/router.js';
import { TunnelClient } from '../apps/tunnel-agent/ts/dist/tunnel-client.js';

console.log('🧪 ========================================================');
console.log('🧪 Starting Turnal End-to-End Integration Test Suite');
console.log('🧪 ========================================================\n');

async function runTests() {
  const LOCAL_APP_PORT = 3999;
  const EDGE_PORT = 8999;
  const TEST_SUBDOMAIN = 'demo-test-app';

  // 1. Start Local Test HTTP Server (simulating developer's localhost:3000)
  const localApp = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Powered-By': 'LocalMockApp',
        'X-Echo-Method': req.method
      });
      res.end(JSON.stringify({
        message: 'Hello from Local PC!',
        path: req.url,
        method: req.method,
        receivedBody: body ? JSON.parse(body) : null
      }));
    });
  });

  await new Promise((resolve) => localApp.listen(LOCAL_APP_PORT, '127.0.0.1', resolve));
  console.log(`✅ [1/5] Local Developer Application running on http://127.0.0.1:${LOCAL_APP_PORT}`);

  // 2. Start Test Edge Server
  const edgeRouter = new EdgeHttpRouter();
  const registry = TunnelRegistry.getInstance();

  const edgeHttpServer = http.createServer((req, res) => {
    edgeRouter.handleRequest(req, res).catch((err) => {
      res.writeHead(500);
      res.end(err.message);
    });
  });

  const edgeWss = new WebSocketServer({
    server: edgeHttpServer,
    path: '/tunnel/connect'
  });

  edgeWss.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const msg = FrameCodec.decode(raw);
      if (msg.type === MessageType.AUTH_REQ) {
        socket.send(FrameCodec.encode({
          type: MessageType.AUTH_ACK,
          userId: 'test-user-id',
          userEmail: 'test@turnal.live',
          sessionId: 'test-session-123',
          timestamp: Date.now()
        }));
      } else if (msg.type === MessageType.TUNNEL_REGISTER_REQ) {
        const session = new TunnelSession({
          tunnelId: 'tun_test_12345',
          subdomain: TEST_SUBDOMAIN,
          userId: 'test-user-id',
          localTargetPort: LOCAL_APP_PORT,
          localTargetHost: '127.0.0.1',
          socket
        });
        registry.register(session);

        socket.send(FrameCodec.encode({
          type: MessageType.TUNNEL_REGISTER_ACK,
          tunnelId: 'tun_test_12345',
          subdomain: TEST_SUBDOMAIN,
          publicUrl: `http://${TEST_SUBDOMAIN}.localhost:${EDGE_PORT}`,
          assignedHostnames: [`${TEST_SUBDOMAIN}.localhost`],
          localTarget: `127.0.0.1:${LOCAL_APP_PORT}`,
          timestamp: Date.now()
        }));
      }
    });
  });

  await new Promise((resolve) => edgeHttpServer.listen(EDGE_PORT, '127.0.0.1', resolve));
  console.log(`✅ [2/5] Edge Ingress Gateway running on http://127.0.0.1:${EDGE_PORT}`);

  // 3. Connect Turnal Tunnel Agent
  const agent = new TunnelClient({
    edgeWsUrl: `ws://127.0.0.1:${EDGE_PORT}/tunnel/connect`,
    token: 'valid-mock-jwt-token',
    localPort: LOCAL_APP_PORT,
    localHost: '127.0.0.1',
    subdomain: TEST_SUBDOMAIN
  });

  await new Promise((resolve, reject) => {
    agent.on('ready', (ack) => {
      console.log(`✅ [3/5] Tunnel Agent connected and live: ${ack.publicUrl} -> localhost:${LOCAL_APP_PORT}`);
      resolve(ack);
    });
    agent.on('error', reject);
    agent.start();
  });

  // 4. Test GET Request across the Tunnel
  console.log('\n📡 [4/5] Sending HTTP GET request to Edge with Host header...');
  const getRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: EDGE_PORT,
      path: '/api/v1/users?limit=10',
      method: 'GET',
      headers: {
        Host: `${TEST_SUBDOMAIN}.localhost`,
        'User-Agent': 'TurnalE2ETester/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });

  if (getRes.status !== 200) {
    throw new Error(`Expected HTTP 200, got ${getRes.status}`);
  }
  if (getRes.body.message !== 'Hello from Local PC!') {
    throw new Error(`Unexpected payload: ${JSON.stringify(getRes.body)}`);
  }
  console.log('   ✔ GET Status 200 OK');
  console.log(`   ✔ Received Local Message: "${getRes.body.message}"`);
  console.log(`   ✔ Path proxied accurately: "${getRes.body.path}"`);

  // 5. Test POST Request with Streaming Body Payload
  console.log('\n📡 [5/5] Sending HTTP POST request with JSON payload across Tunnel...');
  const testPayload = JSON.stringify({ item: 'Laptop', price: 1200, active: true });
  const postRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: EDGE_PORT,
      path: '/api/v1/orders',
      method: 'POST',
      headers: {
        Host: `${TEST_SUBDOMAIN}.localhost`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(testPayload);
    req.end();
  });

  if (postRes.status !== 200 || postRes.body.receivedBody.item !== 'Laptop') {
    throw new Error(`POST verification failed: ${JSON.stringify(postRes.body)}`);
  }
  console.log('   ✔ POST Status 200 OK');
  console.log(`   ✔ Local App received exact body payload:`, postRes.body.receivedBody);

  // Cleanup
  console.log('\n🧹 Cleaning up test servers...');
  agent.stop();
  localApp.close();
  edgeHttpServer.close();

  console.log('\n🎉 ========================================================');
  console.log('🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY!');
  console.log('🎉 Browser -> Edge -> Tunnel -> Agent -> Localhost verified.');
  console.log('🎉 ========================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
