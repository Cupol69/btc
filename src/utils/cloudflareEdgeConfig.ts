/**
 * Cloudflare Edge Compute & Tunnel Utilities
 * Provides Cloudflare Workers scripts, Edge Cache routing, and Cloudflare Tunnel configurations.
 */

export interface CloudflareEdgeStatus {
  isConfigured: boolean;
  edgeDatacenter: string;
  latencyMs: number;
  tunnelActive: boolean;
}

/**
 * Generate production-ready Cloudflare Worker Edge Proxy Script
 * Can be deployed to Cloudflare Workers (dash.cloudflare.com) to bypass CORS and cache CEX/DEX quotes.
 */
export function generateCloudflareWorkerScript(): string {
  return `/**
 * Cloudflare Worker: OnChain Core High-Speed Edge Proxy & Cache
 * Deploy on Cloudflare Workers (Node / V8 Edge Runtime)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MBX-APIKEY',
        },
      });
    }

    // 2. Route: /api/edge/binance/* -> Proxy to Binance API with Edge Cache
    if (url.pathname.startsWith('/api/edge/binance/')) {
      const targetPath = url.pathname.replace('/api/edge/binance/', '');
      const targetUrl = 'https://api.binance.com/' + targetPath + url.search;

      const cacheKey = new Request(targetUrl, request);
      const cache = caches.default;
      let response = await cache.match(cacheKey);

      if (!response) {
        const binanceRes = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Cloudflare-Edge-Node-Onchain/1.0' },
        });

        response = new Response(binanceRes.body, binanceRes);
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Cache-Control', 'public, max-age=2, s-maxage=2');
        response.headers.set('X-Edge-Location', request.cf?.colo || 'EDGE');

        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    }

    // 3. Health & Edge Info
    return new Response(
      JSON.stringify({
        status: 'online',
        service: 'Cloudflare Edge Compute Node',
        datacenter: request.cf?.colo || 'UNKNOWN',
        country: request.cf?.country || 'UNKNOWN',
        timestamp: Date.now(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  },
};
`;
}

/**
 * Generate Python + Cloudflared quickstart for Colab heavy computation node
 */
export function generateColabCloudflareTunnelScript(): string {
  return `# =====================================================================
# CLOUDFLARE TUNNEL + FASTAPI COMPUTE NODE ДЛЯ GOOGLE COLAB
# =====================================================================
import subprocess
import time
import re
import os

print("⚡ 1. Установка cloudflared (Cloudflare Tunnel CLI)...")
subprocess.run(["curl", "-s", "-L", "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64", "-o", "cloudflared"], check=True)
subprocess.run(["chmod", "+x", "cloudflared"], check=True)

print("🚀 2. Запуск FastAPI сервера и туннеля Cloudflare...")
# Запуск uvicorn в фоне
uvicorn_proc = subprocess.Popen(["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
time.sleep(2)

# Запуск Cloudflare Tunnel
cf_proc = subprocess.Popen(["./cloudflared", "tunnel", "--url", "http://localhost:8000"],
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)

public_url = None
for _ in range(30):
    line = cf_proc.stdout.readline()
    if "trycloudflare.com" in line:
        match = re.search(r'(https://[a-zA-Z0-9-]+\.trycloudflare\.com)', line)
        if match:
            public_url = match.group(1)
            break
    time.sleep(0.5)

if public_url:
    print(f"\\n✅ ВАШ CLOUDFLARE EDGE URL: {public_url}")
    print("Вставьте этот URL в дашборд во вкладку '6. Диск' -> 'Colab Compute'!")
else:
    print("❌ Не удалось получить URL. Проверьте вывод терминала.")
`;
}
