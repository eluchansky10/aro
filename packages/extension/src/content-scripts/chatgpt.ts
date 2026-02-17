/**
 * ChatGPT content script
 * Uses React controlled input bypass via native setter + synthetic events
 * Done detection: stop button disappears + send button re-enables
 */
import { injectAndCapture, type InjectionConfig } from './generic-injector.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'inject_prompt') return false;

  const config: InjectionConfig = {
    selectors: message.payload.selectors,
    quirks: {
      ...message.payload.quirks,
      input_type: 'contenteditable',
      needs_native_setter: true,
    },
  };

  injectAndCapture(message.payload.prompt, config).then(sendResponse);
  return true;
});

console.log('[ARO] ChatGPT content script loaded');
