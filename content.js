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

    /* Quick action button styles - matches X's native action buttons */
    .xl-quick-action-wrapper {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .xl-quick-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34.75px;
      height: 34.75px;
      padding: 0;
      margin: 0;
      border-radius: 9999px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease;
      color: #71767b;
    }

    .xl-quick-action:hover {
      color: #f4212e;
      background-color: rgba(244, 33, 46, 0.1);
    }

    .xl-quick-action svg {
      width: 18.75px;
      height: 18.75px;
    }

    .xl-quick-action.loading {
      opacity: 0.5;
      pointer-events: none;
    }

    /* Score dot styles */
    .xl-score-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      cursor: pointer;
      margin-right: 8px;
      flex-shrink: 0;
      transition: transform 0.15s ease;
    }

    .xl-score-dot:hover {
      transform: scale(1.3);
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

    // Center the primary column horizontally
    primaryColumn.style.marginLeft = 'auto';
    primaryColumn.style.marginRight = 'auto';
  }
}

// ============================================
// QUICK ACTIONS
// ============================================

let showNotInterested = false;

function waitForElement(selector, timeout = 2000) {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

async function triggerNotInterested(tweet, button) {
  button.classList.add('loading');

  try {
    // 1. Click the "..." (more) button
    const moreBtn = tweet.querySelector('[data-testid="caret"]');
    if (!moreBtn) {
      console.log('XL: Could not find more button');
      return;
    }
    moreBtn.click();

    // 2. Wait for dropdown to appear
    const dropdown = await waitForElement('[data-testid="Dropdown"]');
    if (!dropdown) {
      console.log('XL: Dropdown did not appear');
      return;
    }

    // 3. Find and click "Not interested in this post"
    await new Promise(r => setTimeout(r, 100)); // Small delay for menu to populate

    const menuItems = document.querySelectorAll('[role="menuitem"]');
    let found = false;
    for (const item of menuItems) {
      if (item.textContent.includes('Not interested')) {
        item.click();
        found = true;
        break;
      }
    }

    if (!found) {
      // Close the dropdown if we didn't find the option
      document.body.click();
      console.log('XL: "Not interested" option not found');
    }
  } catch (err) {
    console.log('XL: Error triggering not interested', err);
  } finally {
    button.classList.remove('loading');
  }
}

function addQuickActionsToTweet(tweet) {
  if (!showNotInterested) return;
  if (tweet.dataset.xlQuickActions) return;
  tweet.dataset.xlQuickActions = 'true';

  // Find the action bar (where like, retweet, reply buttons are)
  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;

  // Create wrapper to match X's button structure
  const wrapper = document.createElement('div');
  wrapper.className = 'xl-quick-action-wrapper';

  // Create "Not Interested" button
  const btn = document.createElement('button');
  btn.className = 'xl-quick-action';
  btn.title = 'Not interested in this post';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
    </svg>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerNotInterested(tweet, btn);
  });

  wrapper.appendChild(btn);
  actionBar.appendChild(wrapper);
}

function removeQuickActionsFromTweets() {
  document.querySelectorAll('.xl-quick-action-wrapper').forEach(wrapper => wrapper.remove());
  document.querySelectorAll('[data-xl-quick-actions]').forEach(tweet => {
    delete tweet.dataset.xlQuickActions;
  });
}

function applyQuickActions() {
  if (showNotInterested) {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(addQuickActionsToTweet);
  } else {
    removeQuickActionsFromTweets();
  }
}

// ============================================
// POST SCORING
// ============================================

let scoringEnabled = false;
let cerebrasApiKey = '';
let scoringPrompt = null;
let extensionContextValid = true;
const scoredTweets = new WeakMap();
const scoringInProgress = new WeakSet();

async function loadScoringPrompt() {
  if (scoringPrompt) return scoringPrompt;
  if (!extensionContextValid) return null;

  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('XL: Extension context invalidated - please refresh the page');
      extensionContextValid = false;
      return null;
    }
    const url = chrome.runtime.getURL('prompt.json');
    const response = await fetch(url);
    scoringPrompt = await response.json();
    return scoringPrompt;
  } catch (err) {
    if (err.message?.includes('Extension context invalidated')) {
      console.log('XL: Extension was reloaded - please refresh the page');
      extensionContextValid = false;
    } else {
      console.log('XL: Failed to load scoring prompt', err);
    }
    return null;
  }
}

function getTweetText(tweet) {
  const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
  if (!tweetTextEl) return '';
  return tweetTextEl.textContent.trim();
}

async function scoreWithCerebras(text) {
  const prompt = await loadScoringPrompt();
  if (!prompt) return null;

  const fullPrompt = prompt.prompt.replace('{{content}}', text);

  const requestBody = {
    model: 'llama-3.3-70b',
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: fullPrompt }
    ],
    max_tokens: 100
  };

  console.log('XL Cerebras Request:', {
    url: 'https://api.cerebras.ai/v1/chat/completions',
    body: requestBody,
    postText: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  });

  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cerebrasApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('XL Cerebras Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('XL Cerebras API Error:', response.status, errorText);

      // Check for quota exceeded
      if (response.status === 429 || errorText.includes('quota') || errorText.includes('rate limit')) {
        chrome.storage.sync.set({ scoringStatus: 'Quota exceeded - try again later' });
      } else {
        chrome.storage.sync.set({ scoringStatus: `API error: ${response.status}` });
      }
      return null;
    }

    // Clear any previous error status on success
    chrome.storage.sync.set({ scoringStatus: '' });

    const data = await response.json();
    console.log('XL Cerebras Response Data:', data);

    const content = data.choices?.[0]?.message?.content;
    console.log('XL Cerebras Content:', content);

    if (!content) return null;

    // Parse JSON response
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log('XL Cerebras Parsed Score:', parsed);
      return parsed;
    }
    return null;
  } catch (err) {
    console.log('XL Cerebras Error:', err);
    return null;
  }
}

function addScoreDot(tweet, result) {
  // Remove existing dot if any
  const existing = tweet.querySelector('.xl-score-dot');
  if (existing) existing.remove();

  const score = result.score;
  const reason = result.reason || 'No reason provided';

  // Validate score
  if (score < 1 || score > 3) return;

  const dot = document.createElement('div');
  dot.className = 'xl-score-dot';
  dot.dataset.score = score;
  dot.dataset.reason = reason;

  // Color based on score
  if (score === 3) {
    dot.style.background = '#00ba7c'; // Green - high quality
  } else if (score === 2) {
    dot.style.background = '#ffd400'; // Yellow - indeterminate
  } else {
    dot.style.background = '#f4212e'; // Red - low quality
  }

  // Click to show reason
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const labels = { 1: 'Low quality', 2: 'Indeterminate', 3: 'High quality' };
    alert(`Score: ${score}/3 (${labels[score]})\n\nReason: ${reason}`);
  });

  // Find the top-right actions row (go up from caret to find the flex container)
  const caretBtn = tweet.querySelector('[data-testid="caret"]');
  if (caretBtn) {
    // Go up to find the row container that holds both Grok and caret
    let container = caretBtn.parentElement;
    // Keep going up until we find a container with multiple children (the actual row)
    while (container && container.children.length <= 1) {
      container = container.parentElement;
    }
    if (container) {
      container.insertBefore(dot, container.firstChild);
    }
  }
}

async function scoreTweet(tweet) {
  if (!scoringEnabled || !cerebrasApiKey) {
    console.log('XL scoreTweet: scoring disabled or no API key');
    return;
  }
  if (scoredTweets.has(tweet)) {
    return; // Already scored, skip silently
  }
  if (scoringInProgress.has(tweet)) {
    return; // In progress, skip silently
  }

  const text = getTweetText(tweet);
  if (!text || text.length < 20) {
    console.log('XL scoreTweet: text too short or empty:', text?.length);
    return;
  }

  console.log('XL scoreTweet: scoring tweet with text length:', text.length);
  scoringInProgress.add(tweet);

  const result = await scoreWithCerebras(text);
  scoringInProgress.delete(tweet);

  if (result && result.score) {
    console.log('XL scoreTweet: got score', result);
    scoredTweets.set(tweet, result);
    addScoreDot(tweet, result);
  } else {
    console.log('XL scoreTweet: no valid result', result);
  }
}

function applyScoring() {
  if (!extensionContextValid) return;
  console.log('XL applyScoring called:', { scoringEnabled, hasApiKey: !!cerebrasApiKey });
  if (!scoringEnabled || !cerebrasApiKey) return;
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  console.log('XL Found tweets to score:', tweets.length);
  tweets.forEach(scoreTweet);
}

// ============================================
// INITIALIZATION
// ============================================

// Load saved settings
chrome.storage.sync.get(['adMode', 'hideNav', 'hideSidebar', 'feedWidth', 'widthProperty', 'showNotInterested', 'scoringEnabled', 'cerebrasApiKey'], (result) => {
  console.log('XL: Loading settings', { scoringEnabled: result.scoringEnabled, hasApiKey: !!result.cerebrasApiKey });
  adMode = result.adMode || 'dim';
  hideNav = result.hideNav || false;
  hideSidebar = result.hideSidebar || false;
  feedWidth = result.feedWidth || '600px';
  widthProperty = result.widthProperty || 'min-width';
  showNotInterested = result.showNotInterested || false;
  scoringEnabled = result.scoringEnabled || false;
  cerebrasApiKey = result.cerebrasApiKey || '';
  applyAdMode();
  applyLayoutSettings();
  applyFeedWidth();
  applyQuickActions();
  applyScoring();
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
    if (message.showNotInterested !== undefined) {
      showNotInterested = message.showNotInterested;
      applyQuickActions();
    }
    if (message.scoringEnabled !== undefined) {
      console.log('XL: scoringEnabled changed to', message.scoringEnabled);
      scoringEnabled = message.scoringEnabled;
      applyScoring();
    }
    if (message.cerebrasApiKey !== undefined) {
      console.log('XL: cerebrasApiKey updated');
      cerebrasApiKey = message.cerebrasApiKey;
      applyScoring();
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
  applyQuickActions();
  applyScoring();
});

observer.observe(document.body, { childList: true, subtree: true });
