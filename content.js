// Site-specific cleaning rules
const cleaningRules = {
  'www.youtube.com': {
    recommendations: [
      '#related',
      '#secondary',
      'ytd-watch-next-secondary-results-renderer',
      'ytd-compact-video-renderer',
      '#items.ytd-watch-next-secondary-results-renderer'
    ],
    shorts: [
      'ytd-reel-shelf-renderer',
      'ytd-guide-entry-renderer:has([title="Shorts"])',
      '[title="Shorts"]',
      'a[href^="/shorts"]'
    ],
    comments: [
      '#comments',
      'ytd-comments',
      '#comment-teaser'
    ],
    ads: [
      '.video-ads',
      '.ytp-ad-module',
      'ytd-display-ad-renderer',
      'ytd-promoted-sparkles-web-renderer',
      '#player-ads'
    ],
    sidebars: [
      '#secondary',
      '#related'
    ],
    popups: [
      'ytd-popup-container',
      'tp-yt-paper-dialog',
      '.ytd-consent-bump-v2-lightbox'
    ]
  },
  
  'youtube.com': {
    recommendations: [
      '#related',
      '#secondary',
      'ytd-watch-next-secondary-results-renderer'
    ],
    shorts: [
      'ytd-reel-shelf-renderer',
      '[title="Shorts"]'
    ],
    comments: ['#comments'],
    ads: ['.video-ads', '.ytp-ad-module'],
    sidebars: ['#secondary'],
    popups: ['ytd-popup-container']
  },
  
  'medium.com': {
    recommendations: [
      '[class*="recommendations"]',
      '[class*="relatedStories"]',
      'aside'
    ],
    popups: [
      '[data-test-id="meter-card"]',
      '[class*="overlay"]',
      '[role="dialog"]',
      '.meteredContent'
    ],
    ads: [
      '[class*="ad-"]',
      '[id*="ad-"]'
    ],
    sidebars: [
      'aside',
      '[class*="sidebar"]'
    ],
    comments: [
      '[class*="responses"]'
    ]
  },
  
  // Reddit
  'www.reddit.com': {
    recommendations: [
      '[data-testid="popular-communities"]',
      '[data-testid="trending-posts"]',
      'shreddit-recent-posts-sidebar',
      'shreddit-subreddit-recommendations',
      '[slot="right-sidebar"]'
    ],
    ads: [
      'shreddit-ad-post',
      '[data-testid="ad-post"]',
      '[data-adclicked-elements]',
      '.promotedlink'
    ],
    sidebars: [
      '[slot="right-sidebar"]',
      'aside[aria-label="Similar subreddits"]'
    ],
    popups: [
      'shreddit-async-loader[bundlename*="modal"]',
      '[role="dialog"]',
      'shreddit-seo-blocker-modal'
    ],
    comments: []
  },
  
  'reddit.com': {
    recommendations: ['[slot="right-sidebar"]'],
    ads: ['shreddit-ad-post', '.promotedlink'],
    sidebars: ['[slot="right-sidebar"]'],
    popups: ['[role="dialog"]'],
    comments: []
  },
  
  // Twitter/X
  'twitter.com': {
    recommendations: [
      '[data-testid="sidebarColumn"]',
      '[aria-label="Timeline: Trending now"]',
      'aside[aria-label*="Subscribe"]'
    ],
    ads: [
      '[data-testid="placementTracking"]',
      '[data-testid*="Promoted"]'
    ],
    sidebars: ['[data-testid="sidebarColumn"]', 'aside'],
    popups: ['[role="dialog"]', '[data-testid="sheetDialog"]'],
    comments: []
  },
  
  'x.com': {
    recommendations: ['[data-testid="sidebarColumn"]'],
    ads: ['[data-testid="placementTracking"]'],
    sidebars: ['[data-testid="sidebarColumn"]'],
    popups: ['[role="dialog"]'],
    comments: []
  },
  
  // Instagram
  'www.instagram.com': {
    recommendations: [
      'section:has([aria-label*="Suggested"])',
      '[class*="Suggested"]'
    ],
    ads: ['article:has([class*="Sponsored"])'],
    sidebars: ['div[role="complementary"]', 'aside'],
    popups: ['[role="dialog"]', '[role="presentation"]'],
    comments: []
  },
  
  // Facebook
  'www.facebook.com': {
    recommendations: [
      '[aria-label*="Suggested"]',
      '[aria-label*="Stories"]',
      'div[role="complementary"]'
    ],
    ads: ['[data-pagelet*="FeedUnit"]:has([aria-label*="Sponsored"])'],
    sidebars: ['[role="complementary"]', 'div[data-pagelet="RightRail"]'],
    popups: ['[role="dialog"]'],
    comments: []
  },
  
  // LinkedIn
  'www.linkedin.com': {
    recommendations: ['.scaffold-layout__aside'],
    ads: ['.ad-banner-container', '[data-test-id="ad-banner"]'],
    sidebars: ['.scaffold-layout__aside', 'aside'],
    popups: ['[role="dialog"]', '.artdeco-modal'],
    comments: []
  },
  
  // TikTok
  'www.tiktok.com': {
    recommendations: ['[data-e2e="recommend-list"]'],
    ads: ['[data-e2e="ad-tag"]'],
    sidebars: ['[data-e2e="right-sidebar"]'],
    popups: ['[data-e2e="modal"]', '[role="dialog"]'],
    comments: []
  },
  
  // Generic news sites
  'generic': {
    ads: [
      '[class*="ad-"]',
      '[id*="ad-"]',
      '[class*="advertisement"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      '.ad',
      '.ads',
      '#ad',
      '#ads'
    ],
    sidebars: [
      'aside',
      '[class*="sidebar"]',
      '[id*="sidebar"]'
    ],
    popups: [
      '[class*="modal"]',
      '[class*="popup"]',
      '[class*="overlay"]',
      '[role="dialog"]',
      '[class*="newsletter"]'
    ],
    recommendations: [
      '[class*="recommended"]',
      '[class*="related"]',
      '[class*="trending"]'
    ],
    comments: [
      '[class*="comment"]',
      '#comments',
      '[id*="comment"]'
    ]
  }
};

// State
let isCleaningActive = false;
let preferences = {
  hideAds: true,
  hideSidebars: true,
  hideRecommendations: true,
  hideComments: false,
  hidePopups: true
};
let readingModeActive = false;
let tempCleanTimer = null;

// Statistics tracking
let stats = {
  totalTimeInFocus: 0,
  distractionsBlocked: 0,
  sessionsCompleted: 0,
  lastSessionStart: null
};
let statsInterval = null;

// Get cleaning selectors for current site
function getCleaningSelectors() {
  const hostname = window.location.hostname;
  const siteRules = cleaningRules[hostname] || cleaningRules['generic'];
  
  const selectors = [];
  
  if (preferences.hideAds && siteRules.ads) {
    selectors.push(...siteRules.ads);
  }
  if (preferences.hideSidebars && siteRules.sidebars) {
    selectors.push(...siteRules.sidebars);
  }
  if (preferences.hideRecommendations && siteRules.recommendations) {
    selectors.push(...siteRules.recommendations);
  }
  if (preferences.hideComments && siteRules.comments) {
    selectors.push(...siteRules.comments);
  }
  if (preferences.hidePopups && siteRules.popups) {
    selectors.push(...siteRules.popups);
  }
  
  return selectors;
}

// Apply cleaning
function applyCleaning() {
  const selectors = getCleaningSelectors();
  let blockedCount = 0;
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element.style.display !== 'none' && !element.hasAttribute('data-cleaned')) {
        blockedCount++;
      }
      element.style.display = 'none';
      element.setAttribute('data-cleaned', 'true');
    });
  });
  
  // Update statistics
  if (blockedCount > 0) {
    updateStatistics('distractionsBlocked', blockedCount);
  }
}

// Remove cleaning
function removeCleaning() {
  const cleanedElements = document.querySelectorAll('[data-cleaned="true"]');
  cleanedElements.forEach(element => {
    element.style.display = '';
    element.removeAttribute('data-cleaned');
  });
}

// Toggle focus mode
function toggleFocus(enabled, prefs, tempDuration) {
  isCleaningActive = enabled;
  if (prefs) {
    preferences = prefs;
  }
  
  if (enabled) {
    applyCleaning();
    
    // Start tracking focus time
    stats.lastSessionStart = Date.now();
    if (statsInterval) clearInterval(statsInterval);
    statsInterval = setInterval(() => {
      updateStatistics('totalTimeInFocus', 1);
    }, 60000); // Update every minute
    
    // Set up temporary timer if specified
    if (tempDuration) {
      if (tempCleanTimer) clearTimeout(tempCleanTimer);
      tempCleanTimer = setTimeout(() => {
        toggleFocus(false);
        // Notify user that temp clean expired
        chrome.runtime.sendMessage({ action: 'tempCleanExpired' });
      }, tempDuration * 60000);
    }
  } else {
    removeCleaning();
    
    // Stop tracking and save session
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
    if (stats.lastSessionStart) {
      const sessionDuration = Math.floor((Date.now() - stats.lastSessionStart) / 60000);
      if (sessionDuration > 0) {
        updateStatistics('totalTimeInFocus', sessionDuration);
        updateStatistics('sessionsCompleted', 1);
      }
      stats.lastSessionStart = null;
    }
    
    if (tempCleanTimer) {
      clearTimeout(tempCleanTimer);
      tempCleanTimer = null;
    }
  }
}

// Apply reading mode
function applyReadingMode(enabled) {
  readingModeActive = enabled;
  
  if (enabled) {
    // Create or update reading mode styles
    let styleElement = document.getElementById('attention-cleaner-reading-mode');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'attention-cleaner-reading-mode';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      body {
        max-width: 800px !important;
        margin: 0 auto !important;
        padding: 40px 20px !important;
        line-height: 1.8 !important;
        font-size: 18px !important;
        background: #fefefe !important;
        color: #333 !important;
      }
      
      article, main, .post-content, .article-content {
        max-width: 100% !important;
        margin: 0 auto !important;
      }
      
      p {
        line-height: 1.8 !important;
        margin-bottom: 1.5em !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        line-height: 1.4 !important;
        margin-top: 1.5em !important;
        margin-bottom: 0.8em !important;
      }
    `;
  } else {
    const styleElement = document.getElementById('attention-cleaner-reading-mode');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Observer to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  if (isCleaningActive) {
    applyCleaning();
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'toggleFocus':
      toggleFocus(message.enabled, message.preferences, message.tempDuration);
      sendResponse({ success: true });
      break;
      
    case 'applyClean':
      preferences = message.preferences;
      if (isCleaningActive) {
        removeCleaning();
        applyCleaning();
      }
      sendResponse({ success: true });
      break;
      
    case 'toggleReadingMode':
      applyReadingMode(message.enabled);
      sendResponse({ success: true });
      break;
  }
  
  return true;
});

// Load preferences on page load
async function loadInitialPreferences() {
  const hostname = window.location.hostname;
  
  chrome.storage.sync.get([hostname, 'readingMode'], (result) => {
    const prefs = result[hostname];
    
    if (prefs) {
      preferences = {
        hideAds: prefs.hideAds !== undefined ? prefs.hideAds : true,
        hideSidebars: prefs.hideSidebars !== undefined ? prefs.hideSidebars : true,
        hideRecommendations: prefs.hideRecommendations !== undefined ? prefs.hideRecommendations : true,
        hideComments: prefs.hideComments !== undefined ? prefs.hideComments : false,
        hidePopups: prefs.hidePopups !== undefined ? prefs.hidePopups : true
      };
      
      if (prefs.focusMode) {
        toggleFocus(true, preferences);
      }
    }
    
    // Apply reading mode if enabled
    if (result.readingMode && result.readingMode[hostname]) {
      applyReadingMode(true);
    }
  });
}

// Update statistics
function updateStatistics(key, increment) {
  chrome.storage.sync.get(['statistics'], (result) => {
    const currentStats = result.statistics || {
      totalTimeInFocus: 0,
      distractionsBlocked: 0,
      sessionsCompleted: 0
    };
    
    currentStats[key] = (currentStats[key] || 0) + increment;
    chrome.storage.sync.set({ statistics: currentStats });
  });
}

// Load statistics
function loadStatistics() {
  chrome.storage.sync.get(['statistics'], (result) => {
    if (result.statistics) {
      stats.totalTimeInFocus = result.statistics.totalTimeInFocus || 0;
      stats.distractionsBlocked = result.statistics.distractionsBlocked || 0;
      stats.sessionsCompleted = result.statistics.sessionsCompleted || 0;
    }
  });
}

// Initialize
loadInitialPreferences();
loadStatistics();
