import urllib.request, json

key = '8f5b78d4fc2945ffb36e88ed1c18f165.vLwFha3wLxxjyNHYvREaqWA_'

payload = json.dumps({
    'model': 'glm-5.1',
    'messages': [
        {'role': 'system', 'content': 'You are Hermes, CEO agent of CLAUDEs Antigravity. Reply in 1 sentence.'},
        {'role': 'user', 'content': 'Confirm you are online and ready to take orders from Josh.'}
    ],
    'max_tokens': 100
}).encode()

req = urllib.request.Request(
    'https://ollama.com/v1/chat/completions',
    data=payload,
    headers={
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
)

try:
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
        print('MODEL:', d.get('model'))
        print('REPLY:', d['choices'][0]['message']['content'])
        print('TOKENS:', d.get('usage'))
except urllib.error.HTTPError as e:
    print('HTTP', e.code, e.read().decode())
except Exception as e:
    print('Error:', e)
