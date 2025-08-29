
import pandas as pd
import numpy as np
from urllib.parse import urlparse
import re
import json

class SimplifiedPhishingDetector:
    """
    Simplified phishing detector for demonstration
    Uses basic heuristics when full ML models aren't available
    """

    def __init__(self):
        self.suspicious_keywords = [
            'secure', 'account', 'webscr', 'login', 'signin',
            'banking', 'confirm', 'update', 'suspended', 'verify',
            'urgent', 'security', 'alert', 'click', 'here'
        ]

        self.shortening_services = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly'
        ]

        self.legitimate_domains = [
            'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
            'apple.com', 'wikipedia.org', 'github.com', 'stackoverflow.com'
        ]

    def extract_basic_features(self, url):
        """Extract basic features from URL"""
        try:
            parsed = urlparse(url)

            features = {}
            features['url_length'] = len(url)
            features['num_dots'] = url.count('.')
            features['num_hyphens'] = url.count('-')
            features['num_slashes'] = url.count('/')
            features['has_ip'] = self._has_ip_address(parsed.hostname or '')
            features['is_https'] = 1 if parsed.scheme == 'https' else 0
            features['suspicious_keywords'] = self._count_suspicious_keywords(url)
            features['is_shortening'] = self._is_shortening_service(parsed.hostname or '')

            return features

        except Exception:
            return {
                'url_length': 0, 'num_dots': 0, 'num_hyphens': 0,
                'num_slashes': 0, 'has_ip': 0, 'is_https': 0,
                'suspicious_keywords': 0, 'is_shortening': 0
            }

    def _has_ip_address(self, hostname):
        """Check if hostname is IP address"""
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        return 1 if re.match(ip_pattern, hostname) else 0

    def _count_suspicious_keywords(self, url):
        """Count suspicious keywords"""
        url_lower = url.lower()
        return sum(1 for keyword in self.suspicious_keywords if keyword in url_lower)

    def _is_shortening_service(self, hostname):
        """Check if uses URL shortening service"""
        return 1 if hostname in self.shortening_services else 0

    def predict_url(self, url):
        """Predict if URL is phishing using heuristics"""
        features = self.extract_basic_features(url)

        # Simple scoring system
        risk_score = 0

        # URL length risk
        if features['url_length'] > 100:
            risk_score += 2
        elif features['url_length'] > 50:
            risk_score += 1

        # IP address instead of domain
        if features['has_ip']:
            risk_score += 3

        # No HTTPS
        if not features['is_https']:
            risk_score += 1

        # Suspicious keywords
        risk_score += features['suspicious_keywords'] * 2

        # URL shortening service
        if features['is_shortening']:
            risk_score += 2

        # Too many special characters
        if features['num_hyphens'] > 3:
            risk_score += 1
        if features['num_dots'] > 5:
            risk_score += 1

        # Calculate confidence and threat level
        confidence = min(risk_score / 10.0, 1.0)

        if confidence < 0.3:
            threat_level = "Low"
            label = "Legitimate"
            prediction = 0
        elif confidence < 0.7:
            threat_level = "Medium"
            label = "Suspicious" 
            prediction = 1
        else:
            threat_level = "High"
            label = "Phishing"
            prediction = 1

        return {
            'url': url,
            'prediction': prediction,
            'label': label,
            'confidence': confidence,
            'threat_level': threat_level,
            'risk_score': risk_score,
            'features': features
        }

def demo_phishing_detection():
    """Demonstrate phishing detection"""
    print("🛡️  PhishBlocker - Simplified Demo")
    print("=" * 50)

    detector = SimplifiedPhishingDetector()

    test_urls = [
        'https://www.google.com',
        'https://www.amazon.com/products',
        'http://paypal-security.com/login',
        'https://microsoft-security.org/update',
        'http://192.168.1.100/login',
        'https://bit.ly/fake-bank',
        'https://secure-banking.tk/urgent-update',
        'https://apple-id-locked.com/unlock?verify=now',
        'https://github.com/user/repo',
        'http://phishing-example.com/fake-bank-login'
    ]

    print("\n🔍 Analyzing URLs...")
    print("-" * 70)

    results = []
    for url in test_urls:
        result = detector.predict_url(url)
        results.append(result)

        print(f"\n📄 URL: {url}")
        print(f"🏷️  Result: {result['label']}")
        print(f"📊 Confidence: {result['confidence']:.3f}")
        print(f"⚠️  Threat Level: {result['threat_level']}")
        print(f"🔢 Risk Score: {result['risk_score']}")

    # Summary statistics
    legitimate_count = len([r for r in results if r['prediction'] == 0])
    phishing_count = len([r for r in results if r['prediction'] == 1])

    print("\n" + "=" * 50)
    print("📈 DETECTION SUMMARY:")
    print("=" * 50)
    print(f"✅ Legitimate URLs detected: {legitimate_count}")
    print(f"⚠️  Phishing URLs detected: {phishing_count}")
    print(f"📊 Total URLs analyzed: {len(results)}")

    # Save results for analysis
    results_df = pd.DataFrame(results)
    results_df.to_csv('PhishBlocker/data/demo_results.csv', index=False)
    print(f"\n💾 Results saved to 'data/demo_results.csv'")

if __name__ == "__main__":
    demo_phishing_detection()
