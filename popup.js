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
chrome.storage.sync.get(['adMode', 'hideNav', 'hideSidebar', 'feedWidth', 'widthProperty'], (result) => {
  const adMode = result.adMode || 'dim';
  const hideNav = result.hideNav || false;
  const hideSidebar = result.hideSidebar || false;
  const feedWidth = result.feedWidth || '600px';
  const widthProperty = result.widthProperty || 'min-width';

  selectOption('ad-mode', adMode);
  selectOption('hide-nav', hideNav ? 'hide' : 'show');
  selectOption('hide-sidebar', hideSidebar ? 'hide' : 'show');
  selectOption('width-property', widthProperty);

  // Handle feed width
  const presetValues = ['600px', '100%', '70%'];
  if (presetValues.includes(feedWidth)) {
    selectOption('feed-width', feedWidth);
  } else {
    selectOption('feed-width', 'custom');
    document.getElementById('custom-width-row').classList.add('show');
    document.getElementById('custom-width-input').value = feedWidth;
  }
});

// Handle ad mode radio button clicks
document.getElementById('ad-mode').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    selectOption('ad-mode', value);
    chrome.storage.sync.set({ adMode: value });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', adMode: value });
    });
  }
});

// Handle hide nav toggle
document.getElementById('hide-nav').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const hideNav = value === 'hide';
    selectOption('hide-nav', value);
    chrome.storage.sync.set({ hideNav });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', hideNav });
    });
  }
});

// Handle hide sidebar toggle
document.getElementById('hide-sidebar').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    const hideSidebar = value === 'hide';
    selectOption('hide-sidebar', value);
    chrome.storage.sync.set({ hideSidebar });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', hideSidebar });
    });
  }
});

// Handle width property toggle (min-width vs max-width)
document.getElementById('width-property').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    selectOption('width-property', value);
    chrome.storage.sync.set({ widthProperty: value });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', widthProperty: value });
    });
  }
});

// Handle feed width selection
document.getElementById('feed-width').addEventListener('click', (e) => {
  if (e.target.classList.contains('radio-option')) {
    const value = e.target.dataset.value;
    selectOption('feed-width', value);

    const customRow = document.getElementById('custom-width-row');

    if (value === 'custom') {
      customRow.classList.add('show');
      // Don't apply yet, wait for user to enter value and click Apply
    } else {
      customRow.classList.remove('show');
      chrome.storage.sync.set({ feedWidth: value });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', feedWidth: value });
      });
    }
  }
});

// Handle custom width apply
document.getElementById('apply-custom-width').addEventListener('click', () => {
  const input = document.getElementById('custom-width-input');
  const value = input.value.trim();

  if (value) {
    chrome.storage.sync.set({ feedWidth: value });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'settingsChanged', feedWidth: value });
    });
  }
});

// Allow Enter key to apply custom width
document.getElementById('custom-width-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('apply-custom-width').click();
  }
});

function selectOption(groupId, value) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.radio-option').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.value === value);
  });
}
