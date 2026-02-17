function updateStatus(connected: boolean) {
  const statusEl = document.getElementById('status')!;
  const textEl = document.getElementById('status-text')!;

  if (connected) {
    statusEl.className = 'status connected';
    textEl.textContent = 'Connected';
  } else {
    statusEl.className = 'status disconnected';
    textEl.textContent = 'Disconnected';
  }
}

// Check status on load
chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
  if (chrome.runtime.lastError) {
    updateStatus(false);
    return;
  }
  updateStatus(response?.connected ?? false);
});

// Refresh every 2 seconds
setInterval(() => {
  chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
    if (chrome.runtime.lastError) {
      updateStatus(false);
      return;
    }
    updateStatus(response?.connected ?? false);
  });
}, 2000);
