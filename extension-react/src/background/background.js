// Background service worker for PhishBlocker extension

const API_BASE_URL = 'http://localhost:8000'

// Listen for URL navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return // Only main frame

    const result = await chrome.storage.sync.get(['settings'])
    const settings = result.settings || { enabled: true, blockPhishing: true, showWarnings: true }

    if (!settings.enabled) return

    const url = details.url

    // Skip chrome:// and extension URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        return
    }

    // Check whitelist
    const whitelist = await chrome.storage.sync.get(['whitelist'])
    const domain = new URL(url).hostname
    if (whitelist.whitelist?.includes(domain)) {
        return // Skip whitelisted domains
    }

    // Scan URL
    try {
        const result = await scanUrl(url)

        // Store scan result
        chrome.storage.local.set({ lastScanResult: result })

        // Add to recent scans
        const { recentScans = [] } = await chrome.storage.local.get(['recentScans'])
        const newScan = {
            url,
            is_phishing: result.is_phishing,
            threat_level: result.threat_level,
            confidence: result.confidence,
            timestamp: new Date().toISOString()
        }
        recentScans.unshift(newScan)
        chrome.storage.local.set({ recentScans: recentScans.slice(0, 10) })

        // Update stats
        updateStats(result)

        // If phishing detected and blocking enabled
        if (result.is_phishing && settings.blockPhishing) {
            // Show warning page
            const warningUrl = chrome.runtime.getURL('src/warning/warning.html') + '?url=' + encodeURIComponent(url)
            console.log('Redirecting to warning page:', warningUrl)

            chrome.tabs.update(details.tabId, {
                url: warningUrl
            })
        } else if (result.is_phishing && settings.showWarnings) {
            // Show notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'PhishBlocker Alert',
                message: `Potential phishing site detected: ${domain}`,
                priority: 2
            })
        }
    } catch (error) {
        console.error('Scan error:', error)
    }
})

// Scan URL function
async function scanUrl(url) {
    try {
        const response = await fetch(`${API_BASE_URL}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                user_id: 'extension_user',
            }),
        })

        if (!response.ok) {
            throw new Error('Scan failed')
        }

        return await response.json()
    } catch (error) {
        console.error('API error:', error)
        // Return safe result on error
        return {
            is_phishing: false,
            confidence: 0,
            threat_level: 'Unknown',
            risk_factors: []
        }
    }
}

// Update statistics
async function updateStats(result) {
    const stats = await chrome.storage.local.get(['stats'])
    const currentStats = stats.stats || {
        scansToday: 0,
        threatsBlocked: 0,
        lastScan: null,
    }

    // Check if it's a new day
    const today = new Date().toDateString()
    const lastScanDate = currentStats.lastScan ? new Date(currentStats.lastScan).toDateString() : null

    if (lastScanDate !== today) {
        currentStats.scansToday = 0
    }

    currentStats.scansToday++
    if (result.is_phishing) {
        currentStats.threatsBlocked++
    }
    currentStats.lastScan = new Date().toISOString()

    await chrome.storage.local.set({ stats: currentStats })
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scanUrl') {
        scanUrl(request.url).then(sendResponse)
        return true // Keep channel open for async response
    }

    if (request.action === 'refreshProtection') {
        console.log('Protection rules refreshed')
        sendResponse({ success: true })
    }

    if (request.action === 'reportFalsePositive') {
        console.log('False positive reported:', request.url)
        // TODO: Send to backend API
        sendResponse({ success: true })
    }
})

console.log('PhishBlocker background service worker loaded')
