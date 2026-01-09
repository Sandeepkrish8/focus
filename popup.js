// DOM Elements
const focusModeToggle = document.getElementById('focusModeToggle');
const toggleStatus = document.getElementById('toggleStatus');
const hideAds = document.getElementById('hideAds');
const hideSidebars = document.getElementById('hideSidebars');
const hideRecommendations = document.getElementById('hideRecommendations');
const hideComments = document.getElementById('hideComments');
const hidePopups = document.getElementById('hidePopups');
const readingModeBtn = document.getElementById('readingMode');
const tempCleanSelect = document.getElementById('tempClean');
const siteInfo = document.getElementById('siteInfo');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsTab = document.getElementById('settingsTab');
const statsTab = document.getElementById('statsTab');

// Statistics elements
const totalTimeEl = document.getElementById('totalTime');
const totalBlockedEl = document.getElementById('totalBlocked');
const totalSessionsEl = document.getElementById('totalSessions');
const avgSessionEl = document.getElementById('avgSession');
const avgBlockedEl = document.getElementById('avgBlocked');
const productiveTimeEl = document.getElementById('productiveTime');
const resetStatsBtn = document.getElementById('resetStats');

let currentTab = null;
let currentDomain = null;

// Initialize popup
async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
  if (tab.url) {
    try {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      siteInfo.textContent = `Site: ${currentDomain}`;
    } catch (e) {
      siteInfo.textContent = 'No site detected';
    }
  }

  // Load saved preferences
  await loadPreferences();
  
  // Load statistics
  await loadStatistics();
  
  // Set up tab switching
  setupTabs();
}

// Load preferences from storage
async function loadPreferences() {
  const storageKey = currentDomain || 'global';
  
  chrome.storage.sync.get([storageKey, 'readingMode', 'tempCleanEnd'], (result) => {
    const prefs = result[storageKey] || {};
    
    // Set focus mode toggle
    focusModeToggle.checked = prefs.focusMode || false;
    updateToggleStatus(prefs.focusMode || false);
    
    // Set cleaning options
    hideAds.checked = prefs.hideAds !== undefined ? prefs.hideAds : true;
    hideSidebars.checked = prefs.hideSidebars !== undefined ? prefs.hideSidebars : true;
    hideRecommendations.checked = prefs.hideRecommendations !== undefined ? prefs.hideRecommendations : true;
    hideComments.checked = prefs.hideComments !== undefined ? prefs.hideComments : false;
    hidePopups.checked = prefs.hidePopups !== undefined ? prefs.hidePopups : true;
    
    // Set reading mode
    if (result.readingMode && result.readingMode[currentDomain]) {
      readingModeBtn.classList.add('active');
    }
    
    // Set temp clean timer
    if (result.tempCleanEnd && result.tempCleanEnd > Date.now()) {
      const remaining = Math.ceil((result.tempCleanEnd - Date.now()) / 60000);
      if (remaining <= 15) tempCleanSelect.value = '15';
      else if (remaining <= 30) tempCleanSelect.value = '30';
      else tempCleanSelect.value = '60';
    }
  });
}

// Save preferences to storage
async function savePreferences() {
  const storageKey = currentDomain || 'global';
  
  const prefs = {
    focusMode: focusModeToggle.checked,
    hideAds: hideAds.checked,
    hideSidebars: hideSidebars.checked,
    hideRecommendations: hideRecommendations.checked,
    hideComments: hideComments.checked,
    hidePopups: hidePopups.checked
  };
  
  chrome.storage.sync.set({ [storageKey]: prefs }, () => {
    console.log('Preferences saved for', storageKey);
  });
}

// Update toggle status display
function updateToggleStatus(isActive) {
  toggleStatus.textContent = isActive ? 'ON' : 'OFF';
  toggleStatus.classList.toggle('active', isActive);
  
  // Update badge
  chrome.action.setBadgeText({ text: isActive ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
}

// Send message to content script
function sendToContentScript(action, data = {}) {
  if (!currentTab) return;
  
  chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Content script not ready, injecting...');
      // Content script might not be loaded yet, try to inject it
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content.js']
      }).then(() => {
        // Try sending message again after injection
        setTimeout(() => {
          chrome.tabs.sendMessage(currentTab.id, { action, ...data });
        }, 100);
      }).catch(err => console.error('Failed to inject content script:', err));
    }
  });
}

// Event Listeners
focusModeToggle.addEventListener('change', async () => {
  const isActive = focusModeToggle.checked;
  updateToggleStatus(isActive);
  
  await savePreferences();
  
  sendToContentScript('toggleFocus', {
    enabled: isActive,
    preferences: {
      hideAds: hideAds.checked,
      hideSidebars: hideSidebars.checked,
      hideRecommendations: hideRecommendations.checked,
      hideComments: hideComments.checked,
      hidePopups: hidePopups.checked
    }
  });
});

// Checkbox listeners
[hideAds, hideSidebars, hideRecommendations, hideComments, hidePopups].forEach(checkbox => {
  checkbox.addEventListener('change', async () => {
    await savePreferences();
    
    // If focus mode is on, reapply cleaning
    if (focusModeToggle.checked) {
      sendToContentScript('applyClean', {
        preferences: {
          hideAds: hideAds.checked,
          hideSidebars: hideSidebars.checked,
          hideRecommendations: hideRecommendations.checked,
          hideComments: hideComments.checked,
          hidePopups: hidePopups.checked
        }
      });
    }
  });
});

// Reading mode toggle
readingModeBtn.addEventListener('click', () => {
  const isActive = readingModeBtn.classList.toggle('active');
  
  // Save reading mode state
  chrome.storage.sync.get(['readingMode'], (result) => {
    const readingModeState = result.readingMode || {};
    readingModeState[currentDomain] = isActive;
    chrome.storage.sync.set({ readingMode: readingModeState });
  });
  
  sendToContentScript('toggleReadingMode', { enabled: isActive });
});

// Temporary clean timer
tempCleanSelect.addEventListener('change', () => {
  const minutes = parseInt(tempCleanSelect.value);
  
  if (minutes > 0) {
    const endTime = Date.now() + (minutes * 60000);
    chrome.storage.sync.set({ tempCleanEnd: endTime });
    
    // Enable focus mode
    focusModeToggle.checked = true;
    updateToggleStatus(true);
    savePreferences();
    
    sendToContentScript('toggleFocus', {
      enabled: true,
      preferences: {
        hideAds: hideAds.checked,
        hideSidebars: hideSidebars.checked,
        hideRecommendations: hideRecommendations.checked,
        hideComments: hideComments.checked,
        hidePopups: hidePopups.checked
      },
      tempDuration: minutes
    });
  } else {
    chrome.storage.sync.remove('tempCleanEnd');
  }
});

// Tab switching
function setupTabs() {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Update active button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide tab content
      if (tabName === 'settings') {
        settingsTab.classList.remove('hidden');
        statsTab.classList.add('hidden');
      } else if (tabName === 'stats') {
        settingsTab.classList.add('hidden');
        statsTab.classList.remove('hidden');
        loadStatistics(); // Refresh stats when tab is opened
      }
    });
  });
}

// Load statistics
async function loadStatistics() {
  chrome.storage.sync.get(['statistics'], (result) => {
    const stats = result.statistics || {
      totalTimeInFocus: 0,
      distractionsBlocked: 0,
      sessionsCompleted: 0
    };
    
    // Update stat cards
    totalTimeEl.textContent = stats.totalTimeInFocus || 0;
    totalBlockedEl.textContent = stats.distractionsBlocked || 0;
    totalSessionsEl.textContent = stats.sessionsCompleted || 0;
    
    // Calculate insights
    const avgSession = stats.sessionsCompleted > 0 
      ? Math.round(stats.totalTimeInFocus / stats.sessionsCompleted)
      : 0;
    avgSessionEl.textContent = `${avgSession} min`;
    
    const avgBlocked = stats.sessionsCompleted > 0
      ? Math.round(stats.distractionsBlocked / stats.sessionsCompleted)
      : 0;
    avgBlockedEl.textContent = avgBlocked;
    
    // Productive time (simplified - could be enhanced with actual time tracking)
    if (stats.sessionsCompleted > 0) {
      productiveTimeEl.textContent = 'All day! 🎉';
    } else {
      productiveTimeEl.textContent = 'N/A';
    }
  });
}

// Reset statistics
resetStatsBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    chrome.storage.sync.set({
      statistics: {
        totalTimeInFocus: 0,
        distractionsBlocked: 0,
        sessionsCompleted: 0
      }
    }, () => {
      loadStatistics();
      alert('✅ Statistics reset successfully!');
    });
  }
});

// Initialize on load
init();
