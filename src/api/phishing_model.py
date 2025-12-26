
import datetime
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score
import lightgbm as lgb
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model # type: ignore
from tensorflow.keras.layers import Dense, Dropout, Input # type: ignore
from tensorflow.keras.optimizers import Adam # type: ignore
from tensorflow.keras.callbacks import EarlyStopping # type: ignore
import joblib
import pickle
import json
import warnings
import os
from url_features import URLFeatureExtractor

warnings.filterwarnings('ignore')

class PhishingDetectionEnsemble:
    """
    Ensemble model combining LightGBM and Neural Network for phishing detection
    Based on the requirements from PhishBlocker project specification
    """

    def __init__(self):
        self.feature_extractor = URLFeatureExtractor()
        self.scaler = StandardScaler()
        self.lgb_model = None
        self.nn_model = None
        self.feature_names = None
        self.ensemble_weights = {'lgb': 0.6, 'nn': 0.4}  # LightGBM weighted higher
        self.is_trained = False
        self.metadata = {
            "version": "1.0.0",
            "features": [],
            "model_type": "Phishing Detection Ensemble",
            "created_at": None
        }

    def extract_features_from_urls(self, urls):
        """Extract features from a list of URLs"""
        print(f"🔄 Extracting features from {len(urls)} URLs...")

        features_list = []
        for i, url in enumerate(urls):
            if i % 1000 == 0:
                print(f"   Processing URL {i+1}/{len(urls)}")

            try:
                features = self.feature_extractor.extract_all_features(url)
                features_list.append(features)
            except Exception as e:
                print(f"   Error processing URL {url}: {str(e)}")
                features_list.append(self.feature_extractor._get_default_features())

        # Convert to DataFrame
        features_df = pd.DataFrame(features_list)

        # Handle any missing values
        features_df = features_df.fillna(0)

        print(f"✅ Feature extraction completed. Shape: {features_df.shape}")
        return features_df

    def prepare_data(self, df):
        """Prepare data for training"""
        print("🔄 Preparing data for training...")

        # Extract features from URLs
        X = self.extract_features_from_urls(df['url'].tolist())
        y = df['label'].values

        # Store feature names
        self.feature_names = X.columns.tolist()

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print(f"✅ Data prepared:")
        print(f"   Training set: {X_train.shape[0]} samples")
        print(f"   Test set: {X_test.shape[0]} samples")
        print(f"   Features: {X_train.shape[1]}")

        return X_train, X_test, y_train, y_test

    def train_lightgbm(self, X_train, y_train, X_val, y_val):
        """Train LightGBM model"""
        print("🔄 Training LightGBM model...")

        # LightGBM parameters optimized for phishing detection
        lgb_params = {
            'objective': 'binary',
            'metric': 'binary_logloss',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.1,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'random_state': 42
        }

        # Create datasets
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

        # Train model
        self.lgb_model = lgb.train(
            lgb_params,
            train_data,
            valid_sets=[train_data, val_data],
            num_boost_round=1000,
            callbacks=[lgb.early_stopping(stopping_rounds=100, verbose=False)]
        )

        print("✅ LightGBM training completed!")
        return self.lgb_model

    def train_neural_network(self, X_train, y_train, X_val, y_val):
        """Train Neural Network model"""
        print("🔄 Training Neural Network model...")

        # Scale features for neural network
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)

        # Build neural network architecture
        model = Sequential([
            Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.3),
            Dense(32, activation='relu'),
            Dropout(0.2),
            Dense(1, activation='sigmoid')
        ])

        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )

        # Early stopping callback
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )

        # Train model
        history = model.fit(
            X_train_scaled, y_train,
            validation_data=(X_val_scaled, y_val),
            epochs=100,
            batch_size=32,
            callbacks=[early_stopping],
            verbose=0
        )

        self.nn_model = model
        print("✅ Neural Network training completed!")
        return model, history

    def train(self, df):
        """Train the ensemble model"""
        print("🚀 Starting PhishBlocker model training...")
        print("=" * 60)
        self.is_trained = True

        # Prepare data
        X_train, X_test, y_train, y_test = self.prepare_data(df)

        # Further split training data for validation
        X_train_split, X_val, y_train_split, y_val = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        

        # Train LightGBM
        self.train_lightgbm(X_train_split, y_train_split, X_val, y_val)

        # Train Neural Network
        self.train_neural_network(X_train_split, y_train_split, X_val, y_val)

        # Evaluate ensemble
        print("🔄 Evaluating ensemble model...")
        y_pred_ensemble = self.predict_proba_ensemble(X_test)
        y_pred_binary = (y_pred_ensemble > 0.5).astype(int)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred_binary)
        auc = roc_auc_score(y_test, y_pred_ensemble)

        print("=" * 60)
        print("🎯 ENSEMBLE MODEL EVALUATION RESULTS:")
        print("=" * 60)
        print(f"Accuracy: {accuracy:.4f}")
        print(f"AUC-ROC: {auc:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred_binary))

        # Feature importance from LightGBM
        feature_importance = self.lgb_model.feature_importance(importance_type='gain')
        feature_importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': feature_importance
        }).sort_values('importance', ascending=False)

        print("\n🔍 TOP 10 MOST IMPORTANT FEATURES:")
        print(feature_importance_df.head(10))

        self.is_trained = True
        print("\n✅ Training completed successfully!")

        return {
            'accuracy': accuracy,
            'auc_roc': auc,
            'feature_importance': feature_importance_df
        }

    def predict_proba_ensemble(self, X):
        """Make probability predictions using ensemble"""
        if self.lgb_model is None or self.nn_model is None:
            raise ValueError("Models must be trained before making predictions")

        # LightGBM predictions
        lgb_probs = self.lgb_model.predict(X, num_iteration=self.lgb_model.best_iteration)

        # Neural Network predictions  
        X_scaled = self.scaler.transform(X)
        nn_probs = self.nn_model.predict(X_scaled, verbose=0).flatten()

        # Ensemble prediction (weighted average)
        ensemble_probs = (
            self.ensemble_weights['lgb'] * lgb_probs + 
            self.ensemble_weights['nn'] * nn_probs
        )

        return ensemble_probs

    def predict(self, X):
        """Make binary predictions using ensemble"""
        probs = self.predict_proba_ensemble(X)
        return (probs > 0.5).astype(int)

    def predict_url(self, url, return_confidence=False):
        """Predict if a single URL is phishing"""
        try:
            # Extract features
            features = self.feature_extractor.extract_all_features(url)
            features_df = pd.DataFrame([features])

            # Make prediction
            prob = self.predict_proba_ensemble(features_df)[0]
            prediction = int(prob > 0.5)

            # Determine threat level
            if prob < 0.3:
                threat_level = "Low"
            elif prob < 0.7:
                threat_level = "Medium"  
            else:
                threat_level = "High"

            result = {
                'url': url,
                'prediction': prediction,
                'label': 'Phishing' if prediction == 1 else 'Legitimate',
                'confidence': float(prob),
                'threat_level': threat_level,
                'features': features
            }

            if return_confidence:
                return result
            else:
                return prediction

        except Exception as e:
            print(f"Error predicting URL {url}: {str(e)}")
            return 0  # Default to legitimate if error

    def save_models(self, base_path='models/'):
        if not self.is_trained:
            raise ValueError("Models must be trained before saving")
        print("💾 Saving trained models...")
        metadata = {
            'feature_names': self.feature_names,
            'ensemble_weights': self.ensemble_weights,
            'is_trained': self.is_trained,
            'version': '1.0.0',  # Add version
            'created_at': datetime.now().isoformat()  # Add timestamp
        }
        with open(f'{base_path}phishblocker_metadata.json', 'w') as f:
            json.dump(metadata, f)
            print("✅ Models saved successfully!")
            with open(f'{base_path}phishblocker_metadata.json', 'w') as f:
                json.dump(metadata, f)
                print("✅ Models saved successfully!")

    

    def get_model_stats(self):
        """Get model statistics and information"""
        if not self.is_trained:
            return {"status": "not_trained"}

        return {
            "status": "trained",
            "num_features": len(self.feature_names),
            "ensemble_weights": self.ensemble_weights,
            "feature_names": self.feature_names
        }
    def load_models(self, base_path='models/'):
        print("📂 Loading trained models...")
        try:
            # Construct full file paths
            lgb_model_path = os.path.join(base_path, 'phishblocker_lgb_model.txt')
            nn_model_path  = os.path.join(base_path, 'phishblocker_nn_model.h5')
            scaler_path    = os.path.join(base_path, 'phishblocker_scaler.pkl')
            metadata_path  = os.path.join(base_path, 'phishblocker_metadata.json')  # <— define this

            print(f" Loading metadata from {metadata_path}")
            with open(metadata_path, 'r') as f:
                loaded_metadata = json.load(f)

            # Now you can safely use loaded_metadata
            self.feature_names    = loaded_metadata['feature_names']
            self.ensemble_weights = loaded_metadata['ensemble_weights']
            self.is_trained       = loaded_metadata['is_trained']

            # Update metadata attribute for API
            self.metadata.update({
                "version": loaded_metadata.get("version", "1.0.0"),
                "features": self.feature_names,
                "created_at": loaded_metadata.get("created_at"),
            })

            # Load the other models
            self.lgb_model = lgb.Booster(model_file=lgb_model_path)
            self.nn_model  = tf.keras.models.load_model(nn_model_path)
            self.scaler    = joblib.load(scaler_path)

            print("✅ Models loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            raise

