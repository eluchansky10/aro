const WS_URL = 'ws://localhost:7749/ws';
const KEEPALIVE_ALARM = 'aro-keepalive';
const KEEPALIVE_PERIOD_MINUTES = 0.4; // ~25s
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

let ws: WebSocket | null = null;
let reconnectDelay = RECONNECT_BASE_MS;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[ARO] Connected to backend');
      reconnectDelay = RECONNECT_BASE_MS;

      // Send ready event
      ws?.send(
        JSON.stringify({
          id: crypto.randomUUID(),
          type: 'extension_ready',
          payload: { version: '0.1.0' },
        })
      );

      // Start keepalive alarm
      chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: KEEPALIVE_PERIOD_MINUTES });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);
        handleBackendMessage(message);
      } catch (err) {
        console.error('[ARO] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[ARO] Disconnected from backend');
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error('[ARO] WebSocket error:', err);
      ws?.close();
    };
  } catch (err) {
    console.error('[ARO] Connection failed:', err);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  console.log(`[ARO] Reconnecting in ${reconnectDelay}ms...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
    connect();
  }, reconnectDelay);
}

async function handleBackendMessage(message: { id: string; type: string; payload: Record<string, unknown> }) {
  if (message.type === 'inject_prompt') {
    const payload = message.payload as {
      task_id: string;
      target_id: string;
      url: string;
      prompt: string;
      selectors: Record<string, string>;
      quirks: Record<string, unknown>;
    };

    try {
      // Find or open tab for the target URL
      const tabs = await chrome.tabs.query({ url: `${new URL(payload.url).origin}/*` });
      let tabId: number;

      if (tabs.length > 0 && tabs[0].id) {
        tabId = tabs[0].id;
      } else {
        const tab = await chrome.tabs.create({ url: payload.url, active: false });
        tabId = tab.id!;
        // Wait for page to load
        await new Promise<void>((resolve) => {
          const listener = (updatedTabId: number, info: chrome.tabs.TabChangeInfo) => {
            if (updatedTabId === tabId && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
        // Extra wait for page hydration
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Forward to content script
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'inject_prompt',
        id: message.id,
        payload: {
          prompt: payload.prompt,
          selectors: payload.selectors,
          quirks: payload.quirks,
        },
      });

      // Send response back to backend
      ws?.send(
        JSON.stringify({
          id: message.id,
          type: 'inject_prompt_response',
          payload: {
            task_id: payload.task_id,
            success: response?.success ?? false,
            response_text: response?.response_text,
            error: response?.error,
            duration_ms: response?.duration_ms ?? 0,
          },
        })
      );
    } catch (err) {
      ws?.send(
        JSON.stringify({
          id: message.id,
          type: 'inject_prompt_response',
          payload: {
            task_id: payload.task_id,
            success: false,
            error: err instanceof Error ? err.message : String(err),
            duration_ms: 0,
          },
        })
      );
    }
  } else if (message.type === 'health_check') {
    const payload = message.payload as {
      target_id: string;
      url: string;
      selectors: Record<string, string>;
    };

    try {
      const tabs = await chrome.tabs.query({ url: `${new URL(payload.url).origin}/*` });
      let tabId: number;
      let needsClose = false;

      if (tabs.length > 0 && tabs[0].id) {
        tabId = tabs[0].id;
      } else {
        const tab = await chrome.tabs.create({ url: payload.url, active: false });
        tabId = tab.id!;
        needsClose = true;
        await new Promise<void>((resolve) => {
          const listener = (updatedTabId: number, info: chrome.tabs.TabChangeInfo) => {
            if (updatedTabId === tabId && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Execute selector test in the tab
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (selectors: Record<string, string>) => {
          const found: Record<string, boolean> = {};
          for (const [name, selector] of Object.entries(selectors)) {
            found[name] = document.querySelector(selector) !== null;
          }
          return found;
        },
        args: [payload.selectors],
      });

      if (needsClose) {
        chrome.tabs.remove(tabId);
      }

      ws?.send(
        JSON.stringify({
          id: message.id,
          type: 'health_check_response',
          payload: {
            target_id: payload.target_id,
            selectors_found: results[0]?.result ?? {},
          },
        })
      );
    } catch (err) {
      ws?.send(
        JSON.stringify({
          id: message.id,
          type: 'health_check_response',
          payload: {
            target_id: payload.target_id,
            selectors_found: {},
            error: err instanceof Error ? err.message : String(err),
          },
        })
      );
    }
  }
}

// Keepalive alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM) {
    // Just accessing the service worker keeps it alive
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connect();
    }
  }
});

// Message handler for popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'get_status') {
    sendResponse({
      connected: ws?.readyState === WebSocket.OPEN,
    });
    return true;
  }
});

// Start connection on install/startup
chrome.runtime.onInstalled.addListener(() => {
  connect();
});

chrome.runtime.onStartup.addListener(() => {
  connect();
});

// Also try immediately
connect();
