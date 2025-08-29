const urlParams = new URLSearchParams(window.location.search);
        const blockedUrl = urlParams.get('blocked_url');
        const threatLevel = urlParams.get('threat_level') || 'Unknown';

        // Display blocked URL and threat level
        if (blockedUrl) {
            document.getElementById('blocked-url').textContent = decodeURIComponent(blockedUrl);
        }
        document.getElementById('threat-level').textContent = threatLevel;

        function goBack() {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'about:blank';
            }
        }

        function proceedAnyway() {
            if (confirm('⚠️ WARNING: You are about to visit a potentially dangerous website. This could put your personal information at risk. Are you absolutely sure you want to continue?')) {
                if (blockedUrl) {
                    window.location.href = decodeURIComponent(blockedUrl);
                }
            }
        }

        function reportFalsePositive() {
            // Send message to background script to report false positive
            chrome.runtime.sendMessage({
                action: 'report_phishing',
                url: blockedUrl,
                feedback: 'False positive reported by user'
            }, (response) => {
                if (response && response.success) {
                    alert('✅ Thank you for reporting this false positive. We will review it to improve our detection accuracy.');
                } else {
                    alert('❌ Failed to submit report. Please try again later.');
                }
            });
        }

        // Auto-focus the go back button
        setTimeout(() => {
            document.querySelector('.btn-safe').focus();
        }, 100);