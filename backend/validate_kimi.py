import requests

API_KEY = "sk-xyZY8hZBXBSgkYolz8YG07B6R2T0DRg1YNHEjprLMyoC2Ba9"
BASE_URL = "https://api.moonshot.cn/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "model": "kimi-k2.5",
    "messages": [{"role": "user", "content": "Hola, ¿funciona?"}],
    "max_tokens": 50
}

print("Testing Kimi API with kimi-k2.5 model...")
print()

response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers=headers,
    json=data,
    timeout=30
)

print(f"Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    content = result['choices'][0]['message']['content']
    tokens_in = result.get('usage', {}).get('prompt_tokens', 0)
    tokens_out = result.get('usage', {}).get('completion_tokens', 0)

    print()
    print("✅ EXITO - Kimi API FUNCIONA")
    print()
    print(f"Response: {content}")
    print()
    print(f"Tokens: {tokens_in} input, {tokens_out} output")
else:
    print()
    print(f"❌ Error: {response.status_code}")
    print(f"Details: {response.text}")
