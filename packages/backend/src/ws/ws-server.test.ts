import { describe, it, expect, afterEach } from 'vitest';
import { createServer } from 'http';
import { WebSocket } from 'ws';
import { createWsServer } from './ws-server.js';

let servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const s of servers) {
    s.close();
  }
  servers = [];
});

function startTestServer(port: number) {
  const httpServer = createServer();
  const mgr = createWsServer(httpServer);
  httpServer.listen(port);
  servers.push({ close: () => httpServer.close() });
  return { httpServer, mgr };
}

function connectClient(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
    servers.push({ close: () => ws.close() });
  });
}

describe('ws-server', () => {
  it('accepts WebSocket connections', async () => {
    const { mgr } = startTestServer(17749);
    const client = await connectClient(17749);

    expect(client.readyState).toBe(WebSocket.OPEN);
    expect(mgr.isConnected()).toBe(true);
  });

  it('detects extension ready', async () => {
    const { mgr } = startTestServer(17750);
    const client = await connectClient(17750);

    client.send(
      JSON.stringify({
        id: 'test-1',
        type: 'extension_ready',
        payload: { version: '0.1.0' },
      })
    );

    // Wait a tick for message processing
    await new Promise((r) => setTimeout(r, 50));
    expect(mgr.isReady()).toBe(true);
  });

  it('routes messages with request/response correlation', async () => {
    const { mgr } = startTestServer(17751);
    const client = await connectClient(17751);

    // Set up client to echo back health check responses
    client.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'health_check') {
        client.send(
          JSON.stringify({
            id: msg.id,
            type: 'health_check_response',
            payload: {
              target_id: msg.payload.target_id,
              selectors_found: { input: true, submit: true },
            },
          })
        );
      }
    });

    const response = await mgr.sendHealthCheck({
      payload: {
        target_id: 'test',
        url: 'https://example.com',
        selectors: { input: '.input', submit: '.submit' },
      },
    });

    expect(response.type).toBe('health_check_response');
    expect(response.payload.selectors_found.input).toBe(true);
  });
});
