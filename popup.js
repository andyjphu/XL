// Helper functions (defined first)
function selectOption(groupId, value) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.radio-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.value === value);
  });
}

function sendToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {
        // Content script not available (not on x.com)
      });
    }
  });
}

// Check domain status
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]?.url) return;

  try {
    const url = new URL(tabs[0].url);
    const hostname = url.hostname;
    const isXDomain = hostname === 'x.com' || hostname.endsWith('.x.com');

    const statusEl = document.getElementById('status');
    const settingsEl = document.getElementById('settings');

    if (statusEl) {
      statusEl.textContent = isXDomain ? 'Active' : 'Inactive';
      statusEl.className = `status ${isXDomain ? 'active' : 'inactive'}`;
    }

    if (settingsEl && !isXDomain) {
      settingsEl.classList.add('disabled-section');
    }
  } catch (e) {
    // Invalid URL (e.g., chrome:// pages)
  }
});

// Load saved settings
chrome.storage.sync.get(['adMode', 'hideNav', 'hideSidebar', 'feedWidth', 'widthProperty', 'showNotInterested', 'scoringEnabled', 'cerebrasApiKey', 'scoringStatus'], (result) => {
  const adMode = result.adMode || 'dim';
  const hideNav = result.hideNav || false;
  const hideSidebar = result.hideSidebar || false;
  const feedWidth = result.feedWidth || '600px';
  const widthProperty = result.widthProperty || 'min-width';
  const showNotInterested = result.showNotInterested || false;
  const scoringEnabled = result.scoringEnabled || false;
  const hasApiKey = !!result.cerebrasApiKey;

  selectOption('ad-mode', adMode);
  selectOption('hide-nav', hideNav ? 'hide' : 'show');
  selectOption('hide-sidebar', hideSidebar ? 'hide' : 'show');
  selectOption('width-property', widthProperty);
  selectOption('show-not-interested', showNotInterested ? 'show' : 'hide');
  selectOption('scoring-enabled', scoringEnabled ? 'on' : 'off');

  // Handle feed width - show current value in input
  const feedWidthInput = document.getElementById('feed-width-input');
  if (feedWidthInput) feedWidthInput.value = feedWidth;

  // Show API key status
  const apiKeyStatus = document.getElementById('api-key-status');
  if (apiKeyStatus && hasApiKey) {
    apiKeyStatus.textContent = 'API key saved';
    apiKeyStatus.style.color = '#00ba7c';
  }

  // Show scoring status (errors like quota exceeded)
  const scoringStatus = document.getElementById('scoring-status');
  if (scoringStatus && result.scoringStatus) {
    scoringStatus.textContent = result.scoringStatus;
  }
});

// Listen for storage changes to update scoring status in real-time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.scoringStatus) {
    const scoringStatus = document.getElementById('scoring-status');
    if (scoringStatus) {
      scoringStatus.textContent = changes.scoringStatus.newValue || '';
    }
  }
});

// Handle ad mode radio button clicks
document.getElementById('ad-mode')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    selectOption('ad-mode', value);
    chrome.storage.sync.set({ adMode: value });
    sendToContentScript({ type: 'settingsChanged', adMode: value });
  }
});

// Handle hide nav toggle
document.getElementById('hide-nav')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const hideNav = value === 'hide';
    selectOption('hide-nav', value);
    chrome.storage.sync.set({ hideNav });
    sendToContentScript({ type: 'settingsChanged', hideNav });
  }
});

// Handle hide sidebar toggle
document.getElementById('hide-sidebar')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const hideSidebar = value === 'hide';
    selectOption('hide-sidebar', value);
    chrome.storage.sync.set({ hideSidebar });
    sendToContentScript({ type: 'settingsChanged', hideSidebar });
  }
});

// Handle width property toggle (min-width vs max-width)
document.getElementById('width-property')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    selectOption('width-property', value);
    chrome.storage.sync.set({ widthProperty: value });
    sendToContentScript({ type: 'settingsChanged', widthProperty: value });
  }
});

// Handle feed width apply
document.getElementById('apply-feed-width')?.addEventListener('click', () => {
  const input = document.getElementById('feed-width-input');
  const value = input?.value.trim() || '600px';

  chrome.storage.sync.set({ feedWidth: value });
  sendToContentScript({ type: 'settingsChanged', feedWidth: value });
});

// Allow Enter key to apply feed width
document.getElementById('feed-width-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('apply-feed-width')?.click();
  }
});

// Handle show not interested toggle
document.getElementById('show-not-interested')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const showNotInterested = value === 'show';
    selectOption('show-not-interested', value);
    chrome.storage.sync.set({ showNotInterested });
    sendToContentScript({ type: 'settingsChanged', showNotInterested });
  }
});

// Handle scoring toggle
document.getElementById('scoring-enabled')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const scoringEnabled = value === 'on';
    selectOption('scoring-enabled', value);
    chrome.storage.sync.set({ scoringEnabled });
    sendToContentScript({ type: 'settingsChanged', scoringEnabled });
  }
});

// Handle API key save
document.getElementById('save-api-key')?.addEventListener('click', () => {
  const input = document.getElementById('cerebras-api-key');
  const statusEl = document.getElementById('api-key-status');
  const value = input?.value.trim();

  if (value) {
    chrome.storage.sync.set({ cerebrasApiKey: value }, () => {
      if (input) input.value = '';
      if (statusEl) {
        statusEl.textContent = 'API key saved';
        statusEl.style.color = '#00ba7c';
      }
      sendToContentScript({ type: 'settingsChanged', cerebrasApiKey: value });
    });
  }
});

// Allow Enter key to save API key
document.getElementById('cerebras-api-key')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('save-api-key')?.click();
  }
});
