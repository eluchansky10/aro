/**
 * Selector tester — tests CSS selectors against the current page DOM.
 * Can be injected via chrome.scripting.executeScript or used as a content script.
 */

export function testSelectors(selectors: Record<string, string>): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  for (const [name, selector] of Object.entries(selectors)) {
    try {
      results[name] = document.querySelector(selector) !== null;
    } catch {
      results[name] = false;
    }
  }
  return results;
}

// Listen for health check messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'health_check') return false;

  const results = testSelectors(message.payload.selectors);
  sendResponse({ selectors_found: results });
  return true;
});
