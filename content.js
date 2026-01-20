// XL Content Script - Runs on x.com

// ============================================
// AD MANAGEMENT
// ============================================

let adMode = 'dim';
const processedAds = new WeakSet();
const adContainers = new Set();

function findAds() {
  const spans = document.querySelectorAll('span');

  for (const span of spans) {
    if (processedAds.has(span)) continue;

    if (span.textContent.trim() === 'Ad' && span.children.length === 0) {
      processedAds.add(span);

      let parent = span;
      for (let i = 0; i < 13; i++) {
        if (parent.parentElement) {
          parent = parent.parentElement;
        }
      }

      if (parent.tagName === 'DIV') {
        parent.dataset.xlAd = 'true';
        adContainers.add(parent);
      }
    }
  }
}

function applyAdMode() {
  findAds();

  for (const container of adContainers) {
    if (!document.contains(container)) {
      adContainers.delete(container);
      continue;
    }

    if (adMode === 'dim') {
      container.style.opacity = '0.5';
      container.style.display = '';
    } else if (adMode === 'hide') {
      container.style.opacity = '';
      container.style.display = 'none';
    } else {
      container.style.opacity = '';
      container.style.display = '';
    }
  }
}

// ============================================
// LAYOUT CONTROLS
// ============================================

let hideNav = false;
let hideSidebar = false;
let feedWidth = '600px';
let widthProperty = 'min-width';
let stylesInjected = false;

function injectLayoutStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const styles = document.createElement('style');
  styles.id = 'xl-layout-styles';
  styles.textContent = `
    header[role="banner"].xl-hidden {
      display: none !important;
    }

    [data-testid="sidebarColumn"].xl-hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(styles);
}

function applyLayoutSettings() {
  injectLayoutStyles();

  const leftSidebar = document.querySelector('header[role="banner"]');
  const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');

  if (leftSidebar) {
    leftSidebar.classList.toggle('xl-hidden', hideNav);
  }

  if (sidebarColumn) {
    sidebarColumn.classList.toggle('xl-hidden', hideSidebar);
  }
}

function applyFeedWidth() {
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');

  if (primaryColumn) {
    // Clear both properties first
    primaryColumn.style.minWidth = '';
    primaryColumn.style.maxWidth = '';

    // Apply the selected property
    if (widthProperty === 'min-width') {
      primaryColumn.style.minWidth = feedWidth;
    } else {
      primaryColumn.style.maxWidth = feedWidth;
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Load saved settings
chrome.storage.sync.get(['adMode', 'hideNav', 'hideSidebar', 'feedWidth', 'widthProperty'], (result) => {
  adMode = result.adMode || 'dim';
  hideNav = result.hideNav || false;
  hideSidebar = result.hideSidebar || false;
  feedWidth = result.feedWidth || '600px';
  widthProperty = result.widthProperty || 'min-width';
  applyAdMode();
  applyLayoutSettings();
  applyFeedWidth();
});

// Listen for settings changes from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsChanged') {
    if (message.adMode !== undefined) {
      adMode = message.adMode;
      applyAdMode();
    }
    if (message.hideNav !== undefined) {
      hideNav = message.hideNav;
      applyLayoutSettings();
    }
    if (message.hideSidebar !== undefined) {
      hideSidebar = message.hideSidebar;
      applyLayoutSettings();
    }
    if (message.feedWidth !== undefined) {
      feedWidth = message.feedWidth;
      applyFeedWidth();
    }
    if (message.widthProperty !== undefined) {
      widthProperty = message.widthProperty;
      applyFeedWidth();
    }
  }
});

// Run on initial load
applyAdMode();

// Run on DOM changes (X.com loads content dynamically)
const observer = new MutationObserver(() => {
  findAds();
  applyAdMode();
  applyLayoutSettings();
  applyFeedWidth();
});

observer.observe(document.body, { childList: true, subtree: true });
