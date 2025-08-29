
// PhishBlocker Extension Background Script

const PHISHBLOCKER_API = 'http://localhost:8000';
const EXTENSION_VERSION = '1.0.0';

// Extension state
let isEnabled = true;
let scanCache = new Map();
let userSettings = {
    blockPhishing: true,
    showWarnings: true,
    autoScan: true,
    threatLevel: 'medium' // low, medium, high
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🛡️ PhishBlocker Extension installed');

    // Load user settings
    const stored = await chrome.storage.sync.get(['userSettings', 'isEnabled']);
    if (stored.userSettings) {
        userSettings = { ...userSettings, ...stored.userSettings };
    }
    if (stored.isEnabled !== undefined) {
        isEnabled = stored.isEnabled;
    }

    // Set initial badge
    updateBadge();
});

// Handle navigation events for real-time scanning
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (!isEnabled || details.frameId !== 0) return;

    const url = details.url;
    

  // Skip if user chose “Proceed Anyway”
  const proceedKey = `proceed_${details.tabId}`;
  const { [proceedKey]: allowed } = await chrome.storage.local.get(proceedKey);
  if (allowed) {
    await chrome.storage.local.remove(proceedKey);
    return;  // Skip blocking once
  }


    console.log('🔍 Scanning URL:', url);

    try {
        const scanResult = await scanURL(url);

        if (scanResult.is_phishing && userSettings.blockPhishing) {
            // Block the navigation by redirecting to warning page
            chrome.tabs.create({
                url: chrome.runtime.getURL('warning.html')
                + `?blocked_url=${encodeURIComponent(url)}`
                + `&threat_level=${scanResult.threat_level}`
                + `&blockedTabId=${details.tabId}`  // renamed param for clarity
            });
        } else if (scanResult.is_phishing && userSettings.showWarnings) {
            // Show warning notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'PhishBlocker Warning',
                message: `Potential phishing site detected: ${url.substring(0, 50)}...`
            });
        }

        // Update badge with threat level
        updateBadgeForTab(details.tabId, scanResult.threat_level);

    } catch (error) {
        console.error('Scan error:', error);
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!isEnabled || changeInfo.status !== 'complete' || !tab.url) return;

    // Skip internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')){
        return;
    }

    // Inject content script for additional protection
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
    } catch (error) {
        console.error('Content script injection failed:', error);
    }
});

// Scan URL using PhishBlocker API
async function scanURL(url) {
    // Check cache first
    const cacheKey = hashURL(url);
    if (scanCache.has(cacheKey)) {
        const cached = scanCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
            return cached.result;
        }
    }

    try {
        const response = await fetch(`${PHISHBLOCKER_API}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                user_id: 'extension_user'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // Cache result
        scanCache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });

        // Clear old cache entries
        if (scanCache.size > 1000) {
            const entries = Array.from(scanCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            for (let i = 0; i < 500; i++) {
                scanCache.delete(entries[i][0]);
            }
        }

        return result;

    } catch (error) {
        console.error('API scan failed:', error);
        // Return safe result if API fails
        return {
            url: url,
            is_phishing: false,
            confidence: 0,
            threat_level: 'Unknown',
            risk_factors: []
        };
    }
}

// Simple URL hash for caching
function hashURL(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Update extension badge
function updateBadge() {
    chrome.action.setBadgeText({
        text: isEnabled ? '' : 'OFF'
    });
    chrome.action.setBadgeBackgroundColor({
        color: isEnabled ? '#28a745' : '#dc3545'
    });
}

// Update badge for specific tab
function updateBadgeForTab(tabId, threatLevel) {
    let badgeText = '';
    let badgeColor = '#28a745';

    switch (threatLevel.toLowerCase()) {
        case 'high':
            badgeText = '!';
            badgeColor = '#dc3545';
            break;
        case 'medium':
            badgeText = '?';
            badgeColor = '#ffc107';
            break;
        case 'low':
        default:
            badgeText = '';
            badgeColor = '#28a745';
            break;
    }

    chrome.action.setBadgeText({ text: badgeText, tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tabId });
}

// Message handler for popup and content script communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'scan_url':
            scanURL(request.url).then(sendResponse);
            return true; // Will respond asynchronously

        case 'get_settings':
            sendResponse({ isEnabled, userSettings });
            break;

        case 'update_settings':
            isEnabled = request.isEnabled !== undefined ? request.isEnabled : isEnabled;
            userSettings = { ...userSettings, ...request.userSettings };

            // Save to storage
            chrome.storage.sync.set({ isEnabled, userSettings });
            updateBadge();
            sendResponse({ success: true });
            break;

        case 'report_phishing':
            // Submit feedback to API
            fetch(`${PHISHBLOCKER_API}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: request.url,
                    is_phishing: true,
                    user_feedback: request.feedback || 'User reported phishing',
                    scan_id: request.scan_id || 'manual_report'
                })
            }).then(response => response.json())
              .then(result => sendResponse({ success: true, result }))
              .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle extension enable/disable
chrome.action.onClicked.addListener(async (tab) => {
    // This will open the popup, but we can also toggle here as fallback
    console.log('Extension icon clicked');
});

console.log('🛡️ PhishBlocker Background Script loaded');
