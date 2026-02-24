#!/usr/bin/env python3
"""
Simple OpenAI-compatible Embedding API Server
Uses sentence-transformers for local embeddings
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Global variable for model
model = None

def get_model():
    """Load or return the embedding model"""
    global model
    if model is None:
        print("Loading embedding model...")
        from sentence_transformers import SentenceTransformer
        # Use a small, fast model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded!")
    return model

@app.route('/v1/embeddings', methods=['POST'])
def embeddings():
    """OpenAI-compatible embeddings endpoint"""
    try:
        data = request.json
        input_text = data.get('input', '')
        
        # Handle both string and array inputs
        if isinstance(input_text, list):
            texts = input_text
        else:
            texts = [input_text]
        
        # Generate embeddings
        model_instance = get_model()
        embeddings = model_instance.encode(texts)
        
        # Convert to list format
        results = []
        for i, embedding in enumerate(embeddings):
            results.append({
                "object": "embedding",
                "embedding": embedding.tolist(),
                "index": i
            })
        
        return jsonify({
            "object": "list",
            "data": results,
            "model": "all-MiniLM-L6-v2",
            "usage": {
                "prompt_tokens": sum(len(t.split()) for t in texts),
                "total_tokens": sum(len(t.split()) for t in texts)
            }
        })
    
    except Exception as e:
        return jsonify({
            "error": {
                "message": str(e),
                "type": "internal_error"
            }
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/ready', methods=['GET'])
def ready():
    """Readiness check endpoint"""
    try:
        # Try to load model to ensure it's ready
        get_model()
        return jsonify({"status": "ready"})
    except Exception as e:
        return jsonify({"status": "not_ready", "error": str(e)}), 503

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting Embedding API server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
