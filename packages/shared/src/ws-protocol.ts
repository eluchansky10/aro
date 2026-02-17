/** JSON-RPC style WebSocket message protocol between backend and extension */

export interface WsMessageBase {
  id: string;
  type: string;
}

// --- Backend → Extension requests ---

export interface InjectPromptRequest extends WsMessageBase {
  type: 'inject_prompt';
  payload: {
    task_id: string;
    target_id: string;
    url: string;
    prompt: string;
    selectors: {
      input: string;
      submit: string;
      response: string;
      streaming_indicator?: string;
      done_indicator?: string;
    };
    quirks: {
      input_type: 'textarea' | 'contenteditable' | 'prosemirror' | 'quill';
      needs_native_setter?: boolean;
      needs_exec_command?: boolean;
      streaming_attr?: string;
      stability_timeout_ms?: number;
    };
  };
}

export interface HealthCheckRequest extends WsMessageBase {
  type: 'health_check';
  payload: {
    target_id: string;
    url: string;
    selectors: Record<string, string>;
  };
}

// --- Extension → Backend responses ---

export interface InjectPromptResponse extends WsMessageBase {
  type: 'inject_prompt_response';
  payload: {
    task_id: string;
    success: boolean;
    response_text?: string;
    error?: string;
    duration_ms: number;
  };
}

export interface HealthCheckResponse extends WsMessageBase {
  type: 'health_check_response';
  payload: {
    target_id: string;
    selectors_found: Record<string, boolean>;
    error?: string;
  };
}

// --- Extension → Backend status events ---

export interface StatusEvent extends WsMessageBase {
  type: 'status';
  payload: {
    connected: boolean;
    active_tabs: string[];
  };
}

export interface ExtensionReadyEvent extends WsMessageBase {
  type: 'extension_ready';
  payload: {
    version: string;
  };
}

// --- Union types ---

export type BackendMessage = InjectPromptRequest | HealthCheckRequest;
export type ExtensionMessage = InjectPromptResponse | HealthCheckResponse | StatusEvent | ExtensionReadyEvent;
export type WsMessage = BackendMessage | ExtensionMessage;
