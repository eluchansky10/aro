/**
 * Perplexity content script
 * Standard textarea + citation link preservation in response
 */
import { injectAndCapture, type InjectionConfig } from './generic-injector.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'inject_prompt') return false;

  const config: InjectionConfig = {
    selectors: message.payload.selectors,
    quirks: {
      ...message.payload.quirks,
      input_type: 'textarea',
    },
  };

  injectAndCapture(message.payload.prompt, config).then(sendResponse);
  return true;
});

console.log('[ARO] Perplexity content script loaded');
