
// PhishBlocker Extension Popup Script

class PhishBlockerPopup {
    constructor() {
        this.currentTab = null;
        this.init();
    }

    async init() {
        console.log('🛡️ PhishBlocker Popup initialized');

        // Get current tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tabs[0];

        // Load current settings
        await this.loadSettings();

        // Set up event listeners
        this.setupEventListeners();

        // Display current URL
        this.displayCurrentUrl();
    }

    async loadSettings() {
        const response = await chrome.runtime.sendMessage({ action: 'get_settings' });

        if (response) {
            document.getElementById('enable-protection').checked = response.isEnabled;
            document.getElementById('block-phishing').checked = response.userSettings.blockPhishing;
            document.getElementById('show-warnings').checked = response.userSettings.showWarnings;

            this.updateStatus(response.isEnabled);
        }
    }

    setupEventListeners() {
        // Protection toggle
        document.getElementById('enable-protection').addEventListener('change', (e) => {
            this.updateSettings({ isEnabled: e.target.checked });
            this.updateStatus(e.target.checked);
        });

        // Block phishing toggle
        document.getElementById('block-phishing').addEventListener('change', (e) => {
            this.updateSettings({ userSettings: { blockPhishing: e.target.checked } });
        });

        // Show warnings toggle
        document.getElementById('show-warnings').addEventListener('change', (e) => {
            this.updateSettings({ userSettings: { showWarnings: e.target.checked } });
        });

        // Scan page button
        document.getElementById('scan-page').addEventListener('click', () => {
            this.scanCurrentPage();
        });
    }

    async updateSettings(settings) {
        await chrome.runtime.sendMessage({
            action: 'update_settings',
            ...settings
        });
    }

    updateStatus(enabled) {
        const statusElement = document.getElementById('status');

        if (enabled) {
            statusElement.className = 'status enabled';
            statusElement.innerHTML = `
                <strong>✅ Protection Enabled</strong>
                <br>
                <small>Actively monitoring for threats</small>
            `;
        } else {
            statusElement.className = 'status disabled';
            statusElement.innerHTML = `
                <strong>❌ Protection Disabled</strong>
                <br>
                <small>Click to enable protection</small>
            `;
        }
    }

    displayCurrentUrl() {
        if (this.currentTab && this.currentTab.url) {
            document.getElementById('current-url').textContent = this.currentTab.url;
        }
    }

    async scanCurrentPage() {
        if (!this.currentTab || !this.currentTab.url) {
            this.showScanResult('No page to scan', 'warning');
            return;
        }

        const scanBtn = document.getElementById('scan-page');
        const originalText = scanBtn.innerHTML;

        scanBtn.innerHTML = '🔄 Scanning...';
        scanBtn.disabled = true;

        try {
            const result = await chrome.runtime.sendMessage({
                action: 'scan_url',
                url: this.currentTab.url
            });

            if (result) {
                this.showScanResult(result);
            } else {
                this.showScanResult('Scan failed - API not available', 'warning');
            }
        } catch (error) {
            console.error('Scan error:', error);
            this.showScanResult('Scan failed - ' + error.message, 'warning');
        }

        scanBtn.innerHTML = originalText;
        scanBtn.disabled = false;
    }

    showScanResult(result, type = null) {
        const resultElement = document.getElementById('scan-result');

        if (typeof result === 'string') {
            resultElement.className = `scan-result ${type || 'warning'}`;
            resultElement.innerHTML = result;
        } else {
            const isPhishing = result.is_phishing;
            const threatLevel = result.threat_level.toLowerCase();

            let className = 'safe';
            let icon = '✅';
            let title = 'Page appears safe';

            if (isPhishing) {
                className = threatLevel === 'high' ? 'threat' : 'warning';
                icon = threatLevel === 'high' ? '🚨' : '⚠️';
                title = threatLevel === 'high' ? 'High threat detected!' : 'Potential threat detected';
            }

            resultElement.className = `scan-result ${className}`;
            resultElement.innerHTML = `
                <div><strong>${icon} ${title}</strong></div>
                <div style="margin-top: 5px; font-size: 11px;">
                    Threat Level: ${result.threat_level}<br>
                    Confidence: ${(result.confidence * 100).toFixed(1)}%<br>
                    Scan ID: ${result.scan_id}
                </div>
                ${result.risk_factors && result.risk_factors.length > 0 ? 
                    `<div style="margin-top: 8px; font-size: 11px;">
                        <strong>Risk Factors:</strong><br>
                        ${result.risk_factors.slice(0, 3).join('<br>')}
                    </div>` : ''
                }
            `;
        }

        resultElement.style.display = 'block';
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PhishBlockerPopup();
});
