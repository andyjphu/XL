// Check domain status
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = new URL(tabs[0].url);
  const hostname = url.hostname;
  const isXDomain = hostname === 'x.com' || hostname.endsWith('.x.com');

  const statusEl = document.getElementById('status');
  const settingsEl = document.getElementById('settings');

  statusEl.textContent = isXDomain ? 'Active' : 'Inactive';
  statusEl.className = `status ${isXDomain ? 'active' : 'inactive'}`;

  if (!isXDomain) {
    settingsEl.classList.add('disabled-section');
  }
});

// Load saved settings
chrome.storage.sync.get(['adMode', 'layoutEnabled'], (result) => {
  const adMode = result.adMode || 'dim';
  const layoutEnabled = result.layoutEnabled !== false; // default to true

  selectOption('ad-mode', adMode);
  selectOption('layout-mode', layoutEnabled ? 'on' : 'off');
});

// Handle ad mode radio button clicks
document.getElementById('ad-mode').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    selectOption('ad-mode', value);
    chrome.storage.sync.set({ adMode: value });

    // Notify content script of change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', adMode: value });
    });
  }
});

// Handle layout mode toggle
document.getElementById('layout-mode').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const enabled = value === 'on';
    selectOption('layout-mode', value);
    chrome.storage.sync.set({ layoutEnabled: enabled });

    // Notify content script of change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', layoutEnabled: enabled });
    });
  }
});

function selectOption(groupId, value) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.radio-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.value === value);
  });
}
