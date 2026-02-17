/**
 * Claude.ai content script
 * Uses ProseMirror injection via document.execCommand('insertText')
 * Detects streaming via data-is-streaming attribute
 */
import { injectAndCapture, type InjectionConfig } from './generic-injector.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'inject_prompt') return false;

  const config: InjectionConfig = {
    selectors: message.payload.selectors,
    quirks: {
      ...message.payload.quirks,
      input_type: 'prosemirror',
      needs_exec_command: true,
    },
  };

  injectAndCapture(message.payload.prompt, config).then(sendResponse);
  return true; // async response
});

console.log('[ARO] Claude.ai content script loaded');
