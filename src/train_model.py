
import pandas as pd
import sys
import os
from api.phishing_model import PhishingDetectionEnsemble


# Add the ml module to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'ml'))

try:
    from api.phishing_model import PhishingDetectionEnsemble
except ImportError:
    print("❌ Could not import PhishingDetectionEnsemble")
    print("📝 Note: This is a demo script. In a real implementation, install required packages:")
    print("   pip install lightgbm tensorflow pandas scikit-learn tldextract dnspython")
    sys.exit(1)

def main():
    print("🚀 PhishBlocker Training Script")
    print("=" * 50)

    # Load dataset
    print("📂 Loading dataset...")
    try:
        df = pd.read_csv('data/sample_dataset.csv')
        print(f"✅ Dataset loaded: {len(df)} samples")
    except FileNotFoundError:
        print("❌ Dataset not found. Please ensure 'data/sample_dataset.csv' exists.")
        return

    # Initialize model
    print("\n🔧 Initializing PhishBlocker ensemble model...")
    model = PhishingDetectionEnsemble()

    # Train model
    print("\n🎯 Starting training process...")
    try:
        results = model.train(df)

        # Save trained models
        os.makedirs('models', exist_ok=True)
        model.save_models('models/')

        print(f"\n🎊 Training completed successfully!")
        print(f"📊 Final Results:")
        print(f"   - Accuracy: {results['accuracy']:.4f}")
        print(f"   - AUC-ROC: {results['auc_roc']:.4f}")

    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        print("📝 Note: This requires installing additional packages like lightgbm, tensorflow")
        return

    # Test with sample URLs
    print("\n🧪 Testing with sample URLs...")
    test_urls = [
        'https://www.google.com',
        'http://paypal-security.com/login',
        'https://www.amazon.com',
        'http://phishing-example.com/fake'
    ]

    for url in test_urls:
        try:
            result = model.predict_url(url, return_confidence=True)
            print(f"\n🔍 {url}")
            print(f"   Result: {result['label']}")
            print(f"   Confidence: {result['confidence']:.4f}")
            print(f"   Threat Level: {result['threat_level']}")
        except Exception as e:
            print(f"   Error: {str(e)}")

if __name__ == "__main__":
    main()
