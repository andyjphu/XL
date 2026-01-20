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

let layoutState = {
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: null,
  rightWidth: null
};

let layoutControlsInjected = false;
let layoutEnabled = true;
let leftChevron = null;
let rightChevron = null;

function loadLayoutState() {
  layoutState.leftCollapsed = localStorage.getItem('xl-left-sidebar-collapsed') === 'true';
  layoutState.rightCollapsed = localStorage.getItem('xl-right-sidebar-collapsed') === 'true';
  layoutState.leftWidth = localStorage.getItem('xl-left-sidebar-width');
  layoutState.rightWidth = localStorage.getItem('xl-right-sidebar-width');
}

function saveLayoutState() {
  localStorage.setItem('xl-left-sidebar-collapsed', layoutState.leftCollapsed);
  localStorage.setItem('xl-right-sidebar-collapsed', layoutState.rightCollapsed);
  if (layoutState.leftWidth) localStorage.setItem('xl-left-sidebar-width', layoutState.leftWidth);
  if (layoutState.rightWidth) localStorage.setItem('xl-right-sidebar-width', layoutState.rightWidth);
}

function injectLayoutControls() {
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');
  const leftSidebar = document.querySelector('header[role="banner"]');

  if (!primaryColumn || layoutControlsInjected) return;

  // Check if controls already exist
  if (document.querySelector('.xl-chevron')) {
    layoutControlsInjected = true;
    return;
  }

  layoutControlsInjected = true;

  // Inject styles
  injectLayoutStyles();

  // Create left chevron (anchored to right edge of left sidebar)
  if (leftSidebar) {
    leftChevron = createChevron('left');
    document.body.appendChild(leftChevron);
    applyLeftCollapse();
    updateLeftChevronPosition();
  }

  // Create right chevron (anchored to left edge of right sidebar)
  if (sidebarColumn) {
    rightChevron = createChevron('right');
    document.body.appendChild(rightChevron);
    applyRightCollapse();
    updateRightChevronPosition();
  }

  // Apply saved widths
  applyStoredWidths();

  // Update chevron positions on scroll/resize
  window.addEventListener('resize', updateChevronPositions);
  window.addEventListener('scroll', updateChevronPositions);
}

function injectLayoutStyles() {
  if (document.getElementById('xl-layout-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'xl-layout-styles';
  styles.textContent = `
    .xl-chevron {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #16181c;
      border: 1px solid #2f3336;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
      z-index: 9999;
    }

    .xl-chevron:hover {
      background: #1d1f23;
      border-color: #1d9bf0;
    }

    .xl-chevron:hover svg {
      color: #1d9bf0;
    }

    .xl-chevron svg {
      width: 14px;
      height: 14px;
      color: #71767b;
      transition: color 0.15s ease;
    }

    /* Left sidebar collapse styles */
    header[role="banner"].xl-collapsed {
      width: 72px !important;
      min-width: 72px !important;
      overflow: hidden;
    }

    header[role="banner"].xl-collapsed nav {
      width: 72px !important;
    }

    header[role="banner"].xl-collapsed [data-testid="SideNav_AccountSwitcher_Button"] span,
    header[role="banner"].xl-collapsed nav a span:not([aria-hidden]) {
      display: none !important;
    }

    /* Right sidebar collapse styles */
    [data-testid="sidebarColumn"].xl-collapsed {
      display: none !important;
    }

    /* Smooth transitions for collapse */
    header[role="banner"],
    [data-testid="sidebarColumn"] {
      transition: width 0.2s ease-out, min-width 0.2s ease-out;
    }
  `;
  document.head.appendChild(styles);
}

function createChevron(side) {
  const chevron = document.createElement('button');
  chevron.className = 'xl-chevron';
  chevron.dataset.xlSide = side;

  updateChevronIcon(chevron, side);

  // Click handler for collapse/expand
  chevron.addEventListener('click', (e) => {
    e.stopPropagation();
    if (side === 'left') {
      layoutState.leftCollapsed = !layoutState.leftCollapsed;
      applyLeftCollapse();
      updateChevronIcon(chevron, side);
      setTimeout(updateLeftChevronPosition, 210); // After transition
    } else {
      layoutState.rightCollapsed = !layoutState.rightCollapsed;
      applyRightCollapse();
      updateChevronIcon(chevron, side);
      setTimeout(updateRightChevronPosition, 210); // After transition
    }
    saveLayoutState();
  });

  return chevron;
}

function updateChevronIcon(chevron, side) {
  // Arrow direction logic:
  // - Points TOWARD panel = collapse (panel is expanded)
  // - Points AWAY from panel = expand (panel is collapsed)

  let pointsLeft;

  if (side === 'left') {
    // Left sidebar: points left (←) when expanded (to collapse), right (→) when collapsed (to expand)
    pointsLeft = !layoutState.leftCollapsed;
  } else {
    // Right sidebar: points right (→) when expanded (to collapse), left (←) when collapsed (to expand)
    pointsLeft = layoutState.rightCollapsed;
  }

  chevron.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="${pointsLeft ? '15,18 9,12 15,6' : '9,18 15,12 9,6'}"></polyline>
    </svg>
  `;
}

function updateChevronPositions() {
  updateLeftChevronPosition();
  updateRightChevronPosition();
}

function updateLeftChevronPosition() {
  if (!leftChevron) return;

  // Anchor to LEFT edge of primary column (stable line)
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  if (primaryColumn) {
    const rect = primaryColumn.getBoundingClientRect();
    leftChevron.style.left = `${rect.left - 12}px`;
  }
}

function updateRightChevronPosition() {
  if (!rightChevron) return;

  // Anchor to RIGHT edge of primary column (stable line)
  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  if (primaryColumn) {
    const rect = primaryColumn.getBoundingClientRect();
    rightChevron.style.left = `${rect.right - 12}px`;
  }
}

function applyLeftCollapse() {
  const leftSidebar = document.querySelector('header[role="banner"]');
  if (leftSidebar) {
    leftSidebar.classList.toggle('xl-collapsed', layoutState.leftCollapsed);
  }
}

function applyRightCollapse() {
  const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');
  if (sidebarColumn) {
    sidebarColumn.classList.toggle('xl-collapsed', layoutState.rightCollapsed);
  }
}

function applyStoredWidths() {
  if (layoutState.leftWidth && !layoutState.leftCollapsed) {
    const leftSidebar = document.querySelector('header[role="banner"]');
    if (leftSidebar) {
      leftSidebar.style.width = `${layoutState.leftWidth}px`;
      leftSidebar.style.minWidth = `${layoutState.leftWidth}px`;
    }
  }

  if (layoutState.rightWidth && !layoutState.rightCollapsed) {
    const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');
    if (sidebarColumn) {
      sidebarColumn.style.width = `${layoutState.rightWidth}px`;
      sidebarColumn.style.minWidth = `${layoutState.rightWidth}px`;
    }
  }
}

function resetLayoutControls() {
  layoutControlsInjected = false;
  leftChevron = null;
  rightChevron = null;
  document.querySelectorAll('.xl-chevron').forEach(el => el.remove());

  // Reset sidebar styles
  const leftSidebar = document.querySelector('header[role="banner"]');
  const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');

  if (leftSidebar) {
    leftSidebar.classList.remove('xl-collapsed');
    leftSidebar.style.width = '';
    leftSidebar.style.minWidth = '';
  }

  if (sidebarColumn) {
    sidebarColumn.classList.remove('xl-collapsed');
    sidebarColumn.style.width = '';
    sidebarColumn.style.minWidth = '';
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Load saved settings
chrome.storage.sync.get(['adMode', 'layoutEnabled'], (result) => {
  adMode = result.adMode || 'dim';
  layoutEnabled = result.layoutEnabled !== false; // default to true
  applyAdMode();
});

// Load layout state from localStorage
loadLayoutState();

// Listen for settings changes from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsChanged') {
    if (message.adMode !== undefined) {
      adMode = message.adMode;
      applyAdMode();
    }
    if (message.layoutEnabled !== undefined) {
      layoutEnabled = message.layoutEnabled;
      if (layoutEnabled) {
        loadLayoutState();
        injectLayoutControls();
      } else {
        resetLayoutControls();
      }
    }
  }
});

// Run on initial load
applyAdMode();

// Attempt to inject layout controls (may need to wait for elements)
function tryInjectLayout() {
  if (!layoutEnabled) return;

  const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
  if (primaryColumn) {
    injectLayoutControls();
  } else {
    // Retry after a short delay
    setTimeout(tryInjectLayout, 500);
  }
}

tryInjectLayout();

// Run on DOM changes (X.com loads content dynamically)
const observer = new MutationObserver(() => {
  findAds();
  applyAdMode();

  // Re-inject layout controls if they were removed (SPA navigation)
  if (layoutEnabled && !document.querySelector('.xl-chevron')) {
    layoutControlsInjected = false;
    injectLayoutControls();
  }

  // Update chevron positions in case layout changed
  if (layoutEnabled) {
    updateChevronPositions();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
