import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '..', '..', '.env') });

import express from 'express';
import { createServer } from 'http';
import { loadSettings } from './store/config-store.js';
import { createWsServer } from './ws/ws-server.js';
import type { ConnectionManager } from './ws/connection-mgr.js';

let serverInstance: { mgr: ConnectionManager; close: () => void } | null = null;

export function startServer(): { mgr: ConnectionManager; close: () => void } {
  if (serverInstance) return serverInstance;

  const settings = loadSettings();
  const app = express();

  app.get('/api/status', (_req, res) => {
    res.json({ status: 'ok', extensionConnected: serverInstance?.mgr.isConnected() ?? false });
  });

  const httpServer = createServer(app);
  const mgr = createWsServer(httpServer);

  httpServer.listen(settings.ws_port, () => {
    console.log(`[ARO] Server listening on port ${settings.ws_port}`);
  });

  serverInstance = {
    mgr,
    close: () => {
      httpServer.close();
      serverInstance = null;
    },
  };

  return serverInstance;
}

export function getServer(): { mgr: ConnectionManager; close: () => void } | null {
  return serverInstance;
}

// If run directly (not imported)
const isMain = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMain) {
  startServer();
}
