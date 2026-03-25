#!/usr/bin/env python3
import os
import sys
from dotenv import load_dotenv

# Load .env first
load_dotenv('.env', override=True)

import anthropic
import requests
import time
from datetime import datetime

# Test logs
logs = '''2026-03-25 14:30:00 [FATAL] Database connection pool exhausted: 100/100
2026-03-25 14:30:15 [ERROR] API timeout: database query took 45 seconds
2026-03-25 14:30:45 [ERROR] Service cascade failure
2026-03-25 14:31:00 [CRITICAL] Revenue impact: losing ~$500/minute'''

def test_anthropic():
    """Test Anthropic Claude Sonnet"""
    print('='*70)
    print('TEST 1: ANTHROPIC (Claude Sonnet)')
    print('='*70)

    api_key = os.getenv('ANTHROPIC_API_KEY', '')
    if not api_key:
        print('[SKIP] ANTHROPIC_API_KEY not configured')
        return None

    client = anthropic.Anthropic(api_key=api_key)

    start = time.time()
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system="You are an SRE analyzing incidents. Return JSON postmortem only.",
            messages=[{"role": "user", "content": f"Analyze incident: {logs}"}]
        )
        elapsed = time.time() - start

        tokens_in = message.usage.input_tokens
        tokens_out = message.usage.output_tokens
        cost = ((tokens_in * 0.003) + (tokens_out * 0.015)) / 1000

        print(f'[OK] Response Time: {elapsed:.2f} seconds')
        print(f'[OK] Tokens: {tokens_in} input, {tokens_out} output')
        print(f'[OK] Cost: ${cost:.6f}')
        print()

        return {
            'provider': 'Anthropic',
            'time': elapsed,
            'cost': cost,
            'status': 'PASS' if elapsed < 7 else 'FAIL'
        }
    except Exception as e:
        print(f'[ERROR] {str(e)[:100]}')
        return None

def test_kimi():
    """Test Kimi Moonshot"""
    print('='*70)
    print('TEST 2: KIMI (Moonshot AI)')
    print('='*70)

    api_key = 'sk-xyZY8hZBXBSgkYolz8YG07B6R2T0DRg1YNHEjprLMyoC2Ba9'

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'model': 'kimi-k2.5',
        'messages': [
            {'role': 'system', 'content': 'You are an SRE analyzing incidents. Return JSON postmortem only.'},
            {'role': 'user', 'content': f'Analyze incident: {logs}'}
        ],
        'temperature': 0.7,
        'max_tokens': 2048
    }

    start = time.time()
    try:
        response = requests.post(
            'https://api.moonshot.cn/v1/chat/completions',
            json=payload,
            headers=headers,
            timeout=30
        )
        elapsed = time.time() - start

        if response.status_code == 200:
            data = response.json()
            tokens_in = data.get('usage', {}).get('prompt_tokens', 0)
            tokens_out = data.get('usage', {}).get('completion_tokens', 0)
            cost = ((tokens_in * 0.0003) + (tokens_out * 0.001)) / 1000

            print(f'[OK] Response Time: {elapsed:.2f} seconds')
            print(f'[OK] Tokens: {tokens_in} input, {tokens_out} output')
            print(f'[OK] Cost: ${cost:.6f}')
            print()

            return {
                'provider': 'Kimi',
                'time': elapsed,
                'cost': cost,
                'status': 'PASS' if elapsed < 7 else 'FAIL'
            }
        else:
            print(f'[ERROR] Status {response.status_code}: {response.text[:100]}')
            return None
    except Exception as e:
        elapsed = time.time() - start
        print(f'[ERROR] {str(e)[:100]}')
        return None

# Run tests
print()
print('#'*70)
print('# SPEED TEST: Anthropic vs Kimi')
print('#'*70)
print()

results = {}

# Test Anthropic
result_anthropic = test_anthropic()
if result_anthropic:
    results['anthropic'] = result_anthropic

# Test Kimi
result_kimi = test_kimi()
if result_kimi:
    results['kimi'] = result_kimi

# Summary
print('='*70)
print('SUMMARY')
print('='*70)
print()

for name, result in results.items():
    status = '[PASS]' if result['status'] == 'PASS' else '[FAIL]'
    print(f"{status} {result['provider']:15} {result['time']:6.2f}s  ${result['cost']:.6f}")

if results:
    print()
    fastest = min(results.values(), key=lambda x: x['time'])
    slowest = max(results.values(), key=lambda x: x['time'])
    cheapest = min(results.values(), key=lambda x: x['cost'])

    print(f"Fastest: {fastest['provider']} ({fastest['time']:.2f}s)")
    print(f"Cheapest: {cheapest['provider']} (${cheapest['cost']:.6f})")

    if 'kimi' in results and 'anthropic' in results:
        speedup = results['anthropic']['time'] / results['kimi']['time']
        savings = (1 - results['kimi']['cost'] / results['anthropic']['cost']) * 100
        print(f"Kimi Speedup: {speedup:.1f}x faster")
        print(f"Kimi Savings: {savings:.0f}% cheaper")

print()
print('='*70)
