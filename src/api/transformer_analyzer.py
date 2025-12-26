"""
Transformer-Based URL Analyzer for Advanced Phishing Detection
Uses DistilBERT for semantic URL analysis and pattern recognition
"""

import torch
import numpy as np
from typing import Dict, List, Any, Optional
from transformers import AutoTokenizer, AutoModel
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class TransformerURLAnalyzer:
    """
    Advanced URL analysis using transformer models
    Detects sophisticated phishing patterns that traditional ML might miss
    """
    
    def __init__(self, model_name: str = "distilbert-base-uncased"):
        """
        Initialize transformer analyzer
        
        Args:
            model_name: Hugging Face model name
        """
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModel.from_pretrained(model_name)
            self.model.eval()  # Set to evaluation mode
            self.model_name = model_name
            
            # Move to GPU if available
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model.to(self.device)
            
            logger.info(f"Transformer analyzer initialized: {model_name} on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to initialize transformer model: {e}")
            raise
    
    def encode_url(self, url: str) -> np.ndarray:
        """
        Generate semantic embeddings for URL
        
        Args:
            url: URL to encode
            
        Returns:
            Embedding vector (768-dimensional for DistilBERT)
        """
        try:
            # Tokenize URL
            inputs = self.tokenizer(
                url,
                return_tensors='pt',
                max_length=128,
                truncation=True,
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate embeddings
            with torch.no_grad():
                outputs = self.model(**inputs)
                # Use mean pooling of last hidden state
                embeddings = outputs.last_hidden_state.mean(dim=1)
            
            # Convert to numpy
            return embeddings.cpu().numpy().flatten()
            
        except Exception as e:
            logger.error(f"Error encoding URL: {e}")
            return np.zeros(768)  # Return zero vector on error
    
    def analyze_url_semantics(self, url: str) -> Dict[str, Any]:
        """
        Analyze URL semantics using transformer embeddings
        
        Args:
            url: URL to analyze
            
        Returns:
            Dictionary with semantic analysis results
        """
        try:
            # Get embeddings
            embeddings = self.encode_url(url)
            
            # Calculate embedding statistics
            embedding_norm = np.linalg.norm(embeddings)
            embedding_mean = np.mean(embeddings)
            embedding_std = np.std(embeddings)
            
            # Detect anomalies in embedding space
            is_anomalous = embedding_std > 0.5  # High variance suggests unusual patterns
            
            return {
                "embedding_dimension": len(embeddings),
                "embedding_norm": float(embedding_norm),
                "embedding_mean": float(embedding_mean),
                "embedding_std": float(embedding_std),
                "is_anomalous": bool(is_anomalous),
                "confidence": min(embedding_std * 2, 1.0)  # Normalize to 0-1
            }
            
        except Exception as e:
            logger.error(f"Error in semantic analysis: {e}")
            return {
                "embedding_dimension": 0,
                "embedding_norm": 0.0,
                "is_anomalous": False,
                "confidence": 0.0
            }
    
    def compare_urls(self, url1: str, url2: str) -> float:
        """
        Calculate semantic similarity between two URLs
        
        Args:
            url1: First URL
            url2: Second URL
            
        Returns:
            Similarity score (0-1, higher = more similar)
        """
        try:
            emb1 = self.encode_url(url1)
            emb2 = self.encode_url(url2)
            
            # Cosine similarity
            similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error comparing URLs: {e}")
            return 0.0
    
    def detect_brand_impersonation(self, url: str, legitimate_brands: List[str]) -> Dict[str, Any]:
        """
        Detect if URL is impersonating a legitimate brand
        
        Args:
            url: URL to check
            legitimate_brands: List of legitimate brand URLs
            
        Returns:
            Detection results with similarity scores
        """
        try:
            url_embedding = self.encode_url(url)
            
            impersonation_scores = {}
            for brand in legitimate_brands:
                brand_embedding = self.encode_url(brand)
                similarity = np.dot(url_embedding, brand_embedding) / (
                    np.linalg.norm(url_embedding) * np.linalg.norm(brand_embedding)
                )
                impersonation_scores[brand] = float(similarity)
            
            # Find most similar brand
            if impersonation_scores:
                most_similar_brand = max(impersonation_scores, key=impersonation_scores.get)
                max_similarity = impersonation_scores[most_similar_brand]
                
                # High similarity but not exact match suggests impersonation
                is_impersonation = max_similarity > 0.7 and url.lower() not in most_similar_brand.lower()
                
                return {
                    "is_impersonation": is_impersonation,
                    "target_brand": most_similar_brand if is_impersonation else None,
                    "similarity_score": max_similarity,
                    "all_scores": impersonation_scores
                }
            
            return {
                "is_impersonation": False,
                "target_brand": None,
                "similarity_score": 0.0,
                "all_scores": {}
            }
            
        except Exception as e:
            logger.error(f"Error detecting brand impersonation: {e}")
            return {
                "is_impersonation": False,
                "target_brand": None,
                "similarity_score": 0.0
            }
    
    def batch_encode(self, urls: List[str]) -> np.ndarray:
        """
        Encode multiple URLs in batch for efficiency
        
        Args:
            urls: List of URLs to encode
            
        Returns:
            Array of embeddings (n_urls x embedding_dim)
        """
        try:
            # Tokenize all URLs
            inputs = self.tokenizer(
                urls,
                return_tensors='pt',
                max_length=128,
                truncation=True,
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate embeddings
            with torch.no_grad():
                outputs = self.model(**inputs)
                embeddings = outputs.last_hidden_state.mean(dim=1)
            
            return embeddings.cpu().numpy()
            
        except Exception as e:
            logger.error(f"Error in batch encoding: {e}")
            return np.zeros((len(urls), 768))
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            "model_name": self.model_name,
            "device": str(self.device),
            "embedding_dimension": 768,
            "max_sequence_length": 128,
            "status": "active"
        }


# Global instance
_transformer_analyzer: Optional[TransformerURLAnalyzer] = None


def get_transformer_analyzer() -> Optional[TransformerURLAnalyzer]:
    """Get global transformer analyzer instance"""
    global _transformer_analyzer
    return _transformer_analyzer


def init_transformer_analyzer(model_name: str = "distilbert-base-uncased") -> TransformerURLAnalyzer:
    """Initialize global transformer analyzer"""
    global _transformer_analyzer
    if _transformer_analyzer is None:
        _transformer_analyzer = TransformerURLAnalyzer(model_name)
    return _transformer_analyzer
