import type { WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import type {
  WsMessage,
  InjectPromptRequest,
  InjectPromptResponse,
  HealthCheckRequest,
  HealthCheckResponse,
  ExtensionReadyEvent,
} from '@aro/shared';

interface PendingRequest {
  resolve: (message: WsMessage) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class ConnectionManager {
  private connections = new Set<WebSocket>();
  private pendingRequests = new Map<string, PendingRequest>();
  private extensionReady = false;
  private listeners = new Map<string, Array<(msg: WsMessage) => void>>();

  addConnection(ws: WebSocket) {
    this.connections.add(ws);
  }

  removeConnection(ws: WebSocket) {
    this.connections.delete(ws);
    if (this.connections.size === 0) {
      this.extensionReady = false;
    }
  }

  isConnected(): boolean {
    return this.connections.size > 0;
  }

  isReady(): boolean {
    return this.extensionReady && this.connections.size > 0;
  }

  handleMessage(_ws: WebSocket, message: WsMessage) {
    // Handle extension ready
    if (message.type === 'extension_ready') {
      this.extensionReady = true;
      this.emit('extension_ready', message);
      return;
    }

    // Handle responses to pending requests
    if (message.type === 'inject_prompt_response' || message.type === 'health_check_response') {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);
        pending.resolve(message);
      }
    }

    // Emit for any listeners
    this.emit(message.type, message);
  }

  async sendInjectPrompt(
    request: Omit<InjectPromptRequest, 'id' | 'type'> & { payload: InjectPromptRequest['payload'] },
    timeoutMs: number = 300_000
  ): Promise<InjectPromptResponse> {
    const id = nanoid();
    const msg: InjectPromptRequest = { id, type: 'inject_prompt', payload: request.payload };
    return this.sendAndWait(msg, timeoutMs) as Promise<InjectPromptResponse>;
  }

  async sendHealthCheck(
    request: Omit<HealthCheckRequest, 'id' | 'type'> & { payload: HealthCheckRequest['payload'] },
    timeoutMs: number = 30_000
  ): Promise<HealthCheckResponse> {
    const id = nanoid();
    const msg: HealthCheckRequest = { id, type: 'health_check', payload: request.payload };
    return this.sendAndWait(msg, timeoutMs) as Promise<HealthCheckResponse>;
  }

  private sendAndWait(message: WsMessage, timeoutMs: number): Promise<WsMessage> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('No extension connected'));
        return;
      }

      const timer = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request ${message.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(message.id, { resolve, reject, timer });

      const data = JSON.stringify(message);
      // Send to first connected extension
      const ws = this.connections.values().next().value;
      if (ws) {
        ws.send(data);
      } else {
        clearTimeout(timer);
        this.pendingRequests.delete(message.id);
        reject(new Error('No extension connected'));
      }
    });
  }

  on(type: string, listener: (msg: WsMessage) => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  off(type: string, listener: (msg: WsMessage) => void) {
    const list = this.listeners.get(type);
    if (list) {
      this.listeners.set(
        type,
        list.filter((l) => l !== listener)
      );
    }
  }

  private emit(type: string, msg: WsMessage) {
    const list = this.listeners.get(type);
    if (list) {
      for (const listener of list) {
        listener(msg);
      }
    }
  }

  /** Wait for the extension to connect. Returns when connected or rejects on timeout. */
  waitForConnection(timeoutMs: number = 30_000): Promise<void> {
    if (this.isConnected()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`No extension connected after ${timeoutMs}ms. Is the Chrome extension loaded?`));
      }, timeoutMs);

      const check = () => {
        if (this.isConnected()) {
          clearTimeout(timer);
          resolve();
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }
}
