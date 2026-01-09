// Background service worker for Website Attention Cleaner

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Website Attention Cleaner installed');
  
  // Set default badge
  chrome.action.setBadgeText({ text: '' });
  
  // Set default preferences
  chrome.storage.sync.get(['global'], (result) => {
    if (!result.global) {
      chrome.storage.sync.set({
        global: {
          focusMode: false,
          hideAds: true,
          hideSidebars: true,
          hideRecommendations: true,
          hideComments: false,
          hidePopups: true
        }
      });
    }
  });
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-focus') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tab = tabs[0];
        const url = new URL(tab.url);
        const hostname = url.hostname;
        
        // Get current preferences and toggle focus mode
        chrome.storage.sync.get([hostname], (result) => {
          const prefs = result[hostname] || {
            hideAds: true,
            hideSidebars: true,
            hideRecommendations: true,
            hideComments: false,
            hidePopups: true
          };
          
          // Toggle focus mode
          const newFocusMode = !prefs.focusMode;
          prefs.focusMode = newFocusMode;
          
          // Save new state
          chrome.storage.sync.set({ [hostname]: prefs });
          
          // Update badge
          chrome.action.setBadgeText({ text: newFocusMode ? 'ON' : '' });
          chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
          
          // Send message to content script
          chrome.tabs.sendMessage(tab.id, {
            action: 'toggleFocus',
            enabled: newFocusMode,
            preferences: {
              hideAds: prefs.hideAds,
              hideSidebars: prefs.hideSidebars,
              hideRecommendations: prefs.hideRecommendations,
              hideComments: prefs.hideComments,
              hidePopups: prefs.hidePopups
            }
          });
        });
      }
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'tempCleanExpired') {
    // Notify user that temporary clean has expired
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Focus Mode Expired',
      message: 'Your temporary clean session has ended.'
    });
    
    // Clear badge
    chrome.action.setBadgeText({ text: '' });
  }
});

// Monitor temp clean timer
function checkTempClean() {
  chrome.storage.sync.get(['tempCleanEnd'], (result) => {
    if (result.tempCleanEnd && result.tempCleanEnd <= Date.now()) {
      // Timer expired, clear it
      chrome.storage.sync.remove('tempCleanEnd');
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

// Check temp clean every minute
setInterval(checkTempClean, 60000);
