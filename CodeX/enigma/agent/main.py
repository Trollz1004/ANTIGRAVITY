from flask import Flask, request, jsonify
import os
import logging
from dotenv import load_dotenv
import google.generativeai as genai

# Load secrets from mapped .env
load_dotenv('/opt/enigma/.env')

app = Flask(__name__)

# Setup logging
logging.basicConfig(level=logging.INFO)

# Gemini integration
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "agents": "Healthy",
        "domains": "Active",
        "protocol": "Omega 60/30/10",
        "details": {
            "aidoesitall.website": "Up",
            "youandinotai.com": "Up",
            "youandinotai.online": "Up",
            "onlinerecycle.org": "Up"
        }
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    if not message:
        return jsonify({"error": "No message provided"}), 400
        
    try:
        response = model.generate_content(message).text
        return jsonify({"response": response})
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        return jsonify({"error": "Failed to generate response"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8011)
