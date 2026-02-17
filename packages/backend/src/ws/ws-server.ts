import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import { WS_PATH } from '@aro/shared';
import { ConnectionManager } from './connection-mgr.js';

export function createWsServer(httpServer: Server): ConnectionManager {
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });
  const mgr = new ConnectionManager();

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Extension connected');
    mgr.addConnection(ws);

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        mgr.handleMessage(ws, message);
      } catch (err) {
        console.error('[WS] Invalid message:', err);
      }
    });

    ws.on('close', () => {
      console.log('[WS] Extension disconnected');
      mgr.removeConnection(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
      mgr.removeConnection(ws);
    });
  });

  return mgr;
}
