/**
 * Gemini content script
 * Uses Quill-like editor injection
 */
import { injectAndCapture, type InjectionConfig } from './generic-injector.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'inject_prompt') return false;

  const config: InjectionConfig = {
    selectors: message.payload.selectors,
    quirks: {
      ...message.payload.quirks,
      input_type: 'quill',
    },
  };

  injectAndCapture(message.payload.prompt, config).then(sendResponse);
  return true;
});

console.log('[ARO] Gemini content script loaded');
