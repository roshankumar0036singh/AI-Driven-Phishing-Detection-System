// PhishBlocker Dashboard JavaScript

class PhishBlockerDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.recentScans = [];
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('🚀 Initializing PhishBlocker Dashboard');

        this.setupEventListeners();
        await this.checkApiConnection();
        await this.loadModelInfo();
        await this.loadGlobalStats();
        this.initializeCharts();

        // Start periodic updates
        setInterval(() => this.updateDashboard(), 30000); // Update every 30 seconds
    }

    setupEventListeners() {
        const scanForm = document.getElementById('url-scan-form');
        scanForm.addEventListener('submit', (e) => this.handleUrlScan(e));
    }

    async checkApiConnection() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/health`);
            this.updateConnectionStatus(true);
            console.log('✅ API connection successful');
        } catch (error) {
            this.updateConnectionStatus(false);
            console.error('❌ API connection failed:', error);
        }
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('status-indicator');
        const apiStatus = document.getElementById('api-status');

        if (connected) {
            statusIndicator.className = 'badge bg-success';
            statusIndicator.textContent = 'API Connected';
            apiStatus.innerHTML = 'API Status: <span class="text-success">Connected</span>';
        } else {
            statusIndicator.className = 'badge bg-danger';
            statusIndicator.textContent = 'API Disconnected';
            apiStatus.innerHTML = 'API Status: <span class="text-danger">Disconnected</span>';
        }
    }

    async handleUrlScan(event) {
        event.preventDefault();

        const urlInput = document.getElementById('url-input');
        const url = urlInput.value.trim();

        if (!url) return;

        this.showScanLoading();

        try {
            const response = await axios.post(`${this.apiBaseUrl}/scan`, {
                url: url,
                user_id: 'dashboard_user'
            });

            this.displayScanResult(response.data);
            this.addToRecentScans(response.data);
            this.updateRecentScansTable();

            // Clear input
            urlInput.value = '';

        } catch (error) {
            console.error('Scan error:', error);
            this.displayScanError('Failed to scan URL. Please check the API connection.');
        }
    }

    showScanLoading() {
        const scanResult = document.getElementById('scan-result');
        scanResult.style.display = 'block';
        scanResult.innerHTML = `
            <div class="alert alert-info">
                <div class="d-flex align-items-center">
                    <div class="spinner me-3"></div>
                    <div>
                        <h6>Scanning URL...</h6>
                        <p class="mb-0">Analyzing threat patterns and extracting features...</p>
                    </div>
                </div>
            </div>
        `;
    }

    displayScanResult(result) {
        const scanResult = document.getElementById('scan-result');
        const alertClass = this.getThreatAlertClass(result.threat_level);

        let riskFactorsHtml = '';
        if (result.risk_factors && result.risk_factors.length > 0) {
            riskFactorsHtml = `
                <div class="mt-3">
                    <h6>Risk Factors Detected:</h6>
                    ${result.risk_factors.map(factor => 
                        `<div class="risk-factor">
                            <i class="fas fa-exclamation-triangle"></i>
                            ${factor}
                        </div>`
                    ).join('')}
                </div>
            `;
        }

        scanResult.innerHTML = `
            <div class="alert ${alertClass} scan-result-new">
                <h6 id="result-title">
                    <i class="fas ${result.is_phishing ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                    ${result.is_phishing ? 'Phishing Detected!' : 'URL Appears Safe'}
                </h6>
                <p id="result-details">
                    URL: <code>${result.url}</code><br>
                    Threat Level: <strong>${result.threat_level}</strong>
                </p>
                <div class="progress mb-2">
                    <div id="confidence-bar" class="progress-bar ${this.getConfidenceBarClass(result.confidence)}" 
                         style="width: ${result.confidence * 100}%"></div>
                </div>
                <small id="confidence-text">
                    Confidence: ${(result.confidence * 100).toFixed(1)}% | 
                    Scan ID: ${result.scan_id}
                </small>
                ${riskFactorsHtml}
            </div>
        `;
    }

    displayScanError(message) {
        const scanResult = document.getElementById('scan-result');
        scanResult.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-times-circle"></i> Scan Failed</h6>
                <p>${message}</p>
            </div>
        `;
    }

    getThreatAlertClass(threatLevel) {
        switch (threatLevel.toLowerCase()) {
            case 'low': return 'alert-success';
            case 'medium': return 'alert-warning';
            case 'high': return 'alert-danger';
            default: return 'alert-info';
        }
    }

    getConfidenceBarClass(confidence) {
        if (confidence < 0.3) return 'bg-success';
        if (confidence < 0.7) return 'bg-warning';
        return 'bg-danger';
    }

    addToRecentScans(result) {
        this.recentScans.unshift({
            ...result,
            timestamp: new Date()
        });

        // Keep only last 10 scans
        if (this.recentScans.length > 10) {
            this.recentScans = this.recentScans.slice(0, 10);
        }
    }

    updateRecentScansTable() {
        const tableBody = document.getElementById('recent-scans-table');

        if (this.recentScans.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No recent scans available
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.recentScans.map(scan => `
            <tr>
                <td>
                    <small title="${scan.url}">
                        ${scan.url.length > 40 ? scan.url.substring(0, 40) + '...' : scan.url}
                    </small>
                </td>
                <td>
                    <span class="${scan.is_phishing ? 'text-danger' : 'text-success'}">
                        <i class="fas ${scan.is_phishing ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                        ${scan.is_phishing ? 'Phishing' : 'Safe'}
                    </span>
                </td>
                <td>
                    <span class="threat-${scan.threat_level.toLowerCase()}">${scan.threat_level}</span>
                </td>
                <td>${(scan.confidence * 100).toFixed(1)}%</td>
                <td>
                    <small>${this.formatTime(scan.timestamp)}</small>
                </td>
            </tr>
        `).join('');
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    async loadModelInfo() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/model/info`);
            const info = response.data;

            document.getElementById('model-type').textContent = info.model_type || 'Unknown';
            document.getElementById('model-version').textContent = info.version || 'Unknown';
            document.getElementById('model-status').textContent = info.status || 'Unknown';
            document.getElementById('model-status').className = `badge ${info.status === 'active' ? 'bg-success' : 'bg-warning'}`;

            if (info.last_updated) {
                const date = new Date(info.last_updated);
                document.getElementById('model-updated').textContent = date.toLocaleDateString();
            }

            if (info.features && info.features.length > 0) {
                const featuresHtml = info.features.map(feature => 
                    `<li><i class="fas fa-check text-success"></i> ${feature}</li>`
                ).join('');
                document.getElementById('model-features').innerHTML = featuresHtml;
            }

        } catch (error) {
            console.error('Failed to load model info:', error);
            document.getElementById('model-type').textContent = 'Failed to load';
            document.getElementById('model-version').textContent = 'N/A';
            document.getElementById('model-status').textContent = 'Error';
            document.getElementById('model-status').className = 'badge bg-danger';
            document.getElementById('model-features').innerHTML = '<li><i class="fas fa-times text-danger"></i> Failed to load features</li>';
        }
    }

    async loadGlobalStats() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/analytics/global/stats`);
            const stats = response.data.platform_stats;

            document.getElementById('total-users').textContent = stats.total_users || '0';
            document.getElementById('total-scans').textContent = stats.total_scans || '0';
            document.getElementById('threats-blocked').textContent = stats.threats_blocked || '0';
            document.getElementById('detection-rate').textContent = `${(stats.detection_rate || 0).toFixed(1)}%`;

        } catch (error) {
            console.error('Failed to load global stats:', error);
            document.getElementById('total-users').textContent = '-';
            document.getElementById('total-scans').textContent = '-';
            document.getElementById('threats-blocked').textContent = '-';
            document.getElementById('detection-rate').textContent = '-%';
        }
    }

    initializeCharts() {
        this.initThreatPieChart();
        this.initActivityLineChart();
    }

    initThreatPieChart() {
        const ctx = document.getElementById('threat-pie-chart').getContext('2d');

        this.charts.threatPie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [65, 25, 10], // Sample data
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    initActivityLineChart() {
        const ctx = document.getElementById('activity-line-chart').getContext('2d');

        // Generate sample data for the last 7 days
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            data.push(Math.floor(Math.random() * 50) + 10);
        }

        this.charts.activityLine = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Scans Performed',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    async updateDashboard() {
        console.log('🔄 Updating dashboard data...');
        await this.checkApiConnection();
        await this.loadGlobalStats();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.phishBlockerDashboard = new PhishBlockerDashboard();
});

// Handle window resize for charts
window.addEventListener('resize', () => {
    if (window.phishBlockerDashboard && window.phishBlockerDashboard.charts) {
        Object.values(window.phishBlockerDashboard.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
});
