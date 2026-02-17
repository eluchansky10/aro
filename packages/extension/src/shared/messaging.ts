/** Send a message to the background service worker and get a response */
export function sendToBackground<T = unknown>(message: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response as T);
      }
    });
  });
}

/** Listen for messages from the background service worker */
export function onMessage(
  handler: (
    message: Record<string, unknown>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => boolean | void
) {
  chrome.runtime.onMessage.addListener(handler);
}
