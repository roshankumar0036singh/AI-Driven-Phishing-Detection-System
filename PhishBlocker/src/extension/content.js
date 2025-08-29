
// PhishBlocker Content Script

(function() {
    'use strict';

    // Avoid running multiple times
    if (window.phishBlockerLoaded) return;
    window.phishBlockerLoaded = true;

    console.log('🛡️ PhishBlocker Content Script loaded on:', window.location.href);

    // Check if this is a potentially suspicious page
    checkPageSecurity();

    // Monitor form submissions for phishing protection
    monitorForms();

    // Add visual indicators for secure/insecure sites
    addSecurityIndicators();

    function checkPageSecurity() {
        const url = window.location.href;

        // Check for common phishing indicators
        const suspiciousIndicators = [
            /login/i,
            /signin/i,
            /account/i,
            /verify/i,
            /suspended/i,
            /urgent/i,
            /security/i
        ];

        const hasHttps = url.startsWith('https://');
        const hasSuspiciousWords = suspiciousIndicators.some(pattern => pattern.test(url));

        if (!hasHttps && hasSuspiciousWords) {
            showSecurityWarning('This page requests sensitive information but is not secured with HTTPS.');
        }

        // Check for suspicious domain patterns
        const domain = window.location.hostname;
        if (domain.includes('paypal') && !domain.endsWith('paypal.com')) {
            showSecurityWarning('This site mimics PayPal but is not the official PayPal website.');
        }

        if (domain.includes('amazon') && !domain.endsWith('amazon.com') && !domain.endsWith('amazon.co.uk')) {
            showSecurityWarning('This site mimics Amazon but is not the official Amazon website.');
        }
    }

    function monitorForms() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            // Check for password or credit card fields
            const hasPasswordField = form.querySelector('input[type="password"]');
            const hasCreditCardField = form.querySelector('input[name*="card"], input[name*="credit"], input[placeholder*="card"]');

            if (hasPasswordField || hasCreditCardField) {
                // Add warning for non-HTTPS forms
                if (!window.location.href.startsWith('https://')) {
                    addFormWarning(form, 'This form is not secured with HTTPS encryption.');
                }

                // Monitor form submission
                form.addEventListener('submit', function(event) {
                    const isSecure = window.location.href.startsWith('https://');
                    const domain = window.location.hostname;

                    // Check for suspicious patterns
                    if (!isSecure || domain.includes('bit.ly') || domain.includes('tinyurl')) {
                        if (!confirm('⚠️ PhishBlocker Warning: This form may not be secure. Are you sure you want to submit your information?')) {
                            event.preventDefault();
                            return false;
                        }
                    }
                });
            }
        });
    }

    function addSecurityIndicators() {
        // Create floating security indicator
        const indicator = document.createElement('div');
        indicator.id = 'phishblocker-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 999999;
            background: ${window.location.href.startsWith('https://') ? '#28a745' : '#dc3545'};
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        indicator.innerHTML = window.location.href.startsWith('https://') 
            ? '🛡️ Secure' 
            : '⚠️ Not Secure';

        indicator.addEventListener('click', function() {
            showPhishBlockerInfo();
        });

        document.body.appendChild(indicator);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0.3';
            }
        }, 5000);
    }

    function showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            color: white;
            padding: 15px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: slideDown 0.5s ease;
        `;

        warning.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                🛡️ PhishBlocker Security Warning: ${message}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-left: 15px; padding: 5px 10px; background: white; border: none; border-radius: 5px; cursor: pointer;">
                    Dismiss
                </button>
            </div>
        `;

        document.body.insertBefore(warning, document.body.firstChild);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }

    function addFormWarning(form, message) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-size: 14px;
        `;

        warning.innerHTML = `⚠️ ${message}`;
        form.parentNode.insertBefore(warning, form);
    }

    function showPhishBlockerInfo() {
        alert(`🛡️ PhishBlocker Extension

Current Page: ${window.location.href}
Security Status: ${window.location.href.startsWith('https://') ? 'Secure (HTTPS)' : 'Not Secure (HTTP)'}

PhishBlocker is actively protecting you from phishing threats and malicious websites.`);
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

})();
