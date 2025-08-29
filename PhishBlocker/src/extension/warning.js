// warning.js
(() => {
  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const blockedUrl  = params.get('blocked_url') || '';
  const threatLevel = params.get('threat_level') || 'Unknown';
  const tabId       = Number(params.get('tabId'));
  const blockedTabId   = Number(params.get('blockedTabId'));

  // Populate UI
  document.getElementById('blocked-url').textContent = blockedUrl;
  document.getElementById('threat-level').textContent = threatLevel;

  // Button handlers
  document.getElementById('go-back').addEventListener('click', () => {
     if (!isNaN(blockedTabId)) {
    // Close the original blocked tab to “go back safely” (close the risky tab)
    chrome.tabs.remove(blockedTabId, () => {
      // Optionally close the warning tab itself after closing the risky one
      chrome.tabs.getCurrent(currentTab => chrome.tabs.remove(currentTab.id));
    });
  }
  });

  document.getElementById('report-false-positive').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'report_phishing',
      url: blockedUrl,
      feedback: 'False positive reported',
      scan_id: `fp_${Date.now()}`
    }).then(() => {
      alert('False positive reported. Thank you!');
    });
  });

 document.getElementById('proceed-anyway').addEventListener('click', () => {
  if (!isNaN(blockedTabId)) {
    chrome.storage.local.set({ [`proceed_${blockedTabId}`]: true }, () => {
      // Reload original tab with blocked URL
      chrome.tabs.update(blockedTabId, { url: blockedUrl });
      // Close the warning tab (current tab)
      chrome.tabs.getCurrent(currentTab => chrome.tabs.remove(currentTab.id));
    });
  }
});

})();
