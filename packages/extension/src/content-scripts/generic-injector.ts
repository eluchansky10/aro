/**
 * Generic prompt injector — selector-driven injection, submission, and response capture.
 * Each provider-specific content script can override parts of this behavior.
 */

export interface InjectionConfig {
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
}

const DEFAULT_STABILITY_MS = 5000;
const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 300_000; // 5 minutes

/**
 * Inject a prompt into the LLM input, submit it, and wait for the response.
 */
export async function injectAndCapture(
  prompt: string,
  config: InjectionConfig
): Promise<{ success: boolean; response_text?: string; error?: string; duration_ms: number }> {
  const start = Date.now();

  try {
    // Step 1: Find and fill the input
    const input = await waitForElement(config.selectors.input, 10_000);
    if (!input) {
      return { success: false, error: `Input not found: ${config.selectors.input}`, duration_ms: Date.now() - start };
    }

    await fillInput(input, prompt, config.quirks);

    // Small delay before submitting
    await sleep(300);

    // Step 2: Submit
    const submitted = await submitPrompt(config.selectors.submit);
    if (!submitted) {
      return { success: false, error: `Submit button not found: ${config.selectors.submit}`, duration_ms: Date.now() - start };
    }

    // Step 3: Wait for response
    const responseText = await waitForResponse(config);
    if (responseText === null) {
      return { success: false, error: 'Response capture timed out', duration_ms: Date.now() - start };
    }

    return { success: true, response_text: responseText, duration_ms: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - start,
    };
  }
}

/** Fill the input element with the prompt text */
async function fillInput(
  input: Element,
  prompt: string,
  quirks: InjectionConfig['quirks']
): Promise<void> {
  // Focus the element
  (input as HTMLElement).focus();
  await sleep(100);

  if (quirks.needs_exec_command || quirks.input_type === 'prosemirror') {
    // ProseMirror: use execCommand insertText
    // Clear existing content first
    if (input instanceof HTMLElement && input.getAttribute('contenteditable') === 'true') {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    document.execCommand('insertText', false, prompt);
  } else if (quirks.needs_native_setter || quirks.input_type === 'contenteditable') {
    // React controlled input bypass
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
      )?.set ?? Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value'
      )?.set;
      nativeSetter?.call(input, prompt);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (input instanceof HTMLElement && input.getAttribute('contenteditable') === 'true') {
      // Contenteditable div (e.g. ChatGPT's #prompt-textarea)
      input.focus();
      // Select all + delete
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      selection?.removeAllRanges();
      selection?.addRange(range);
      // Insert text via execCommand for React compatibility
      document.execCommand('insertText', false, prompt);
    }
  } else if (quirks.input_type === 'quill') {
    // Quill-like editor
    if (input instanceof HTMLElement) {
      input.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('insertText', false, prompt);
    }
  } else {
    // Standard textarea
    if (input instanceof HTMLTextAreaElement) {
      input.value = prompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Dispatch extra events for frameworks that need them
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

/** Click the submit button */
async function submitPrompt(submitSelector: string): Promise<boolean> {
  // Wait for submit button to be enabled
  for (let i = 0; i < 20; i++) {
    const btn = document.querySelector(submitSelector) as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
    await sleep(250);
  }
  return false;
}

/** Wait for the response to stabilize (no more DOM changes) */
async function waitForResponse(config: InjectionConfig): Promise<string | null> {
  const { selectors, quirks } = config;
  const stabilityMs = quirks.stability_timeout_ms ?? DEFAULT_STABILITY_MS;

  // Wait for streaming to start (if indicator provided)
  if (selectors.streaming_indicator) {
    await waitForElement(selectors.streaming_indicator, 30_000);
  } else {
    // Wait a bit for response to appear
    await sleep(2000);
  }

  let lastContent = '';
  let stableTime = 0;
  const startWait = Date.now();

  while (Date.now() - startWait < MAX_WAIT_MS) {
    // Check if streaming is done
    if (selectors.done_indicator) {
      const done = document.querySelector(selectors.done_indicator);
      if (done && stableTime > 1000) {
        break;
      }
    }

    // If streaming attr provided, check it
    if (quirks.streaming_attr) {
      const streamingEl = document.querySelector(`[${quirks.streaming_attr}="true"]`);
      if (!streamingEl && stableTime > 1000) {
        break;
      }
    }

    // Get current response text
    const responseEl = document.querySelector(selectors.response);
    const currentContent = responseEl?.textContent?.trim() ?? '';

    if (currentContent === lastContent && currentContent.length > 0) {
      stableTime += POLL_INTERVAL_MS;
      if (stableTime >= stabilityMs) {
        break;
      }
    } else {
      lastContent = currentContent;
      stableTime = 0;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  // Capture final response
  const responseEl = document.querySelector(selectors.response);
  if (!responseEl) return null;

  // Try to get innerHTML for formatting, fall back to textContent
  return responseEl.innerHTML || responseEl.textContent || null;
}

/** Wait for an element to appear in the DOM */
function waitForElement(selector: string, timeoutMs: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
