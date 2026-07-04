import fs from 'fs';
import path from 'path';

console.log('═'.repeat(60));
console.log('  ABSORA AI HUB — N8N WATCHDOG RUNNER (GITHUB ACTIONS)');
console.log('═'.repeat(60));

const TARGET_URL = process.env.VERCEL_APP_URL || 'https://absora-ai-hub.vercel.app';
const SECRET_KEY = process.env.ABSORA_SECRET_KEY || 'absora-secret-key-2026';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || null;

async function runWatchdog() {
  const timestamp = new Date().toISOString();
  console.log(`[Watchdog ${timestamp}] Target URL: ${TARGET_URL}`);

  try {
    // 1. Health Ping Serverless API
    const statusRes = await fetch(`${TARGET_URL}/api/models/status`);
    if (!statusRes.ok) {
      throw new Error(`Platform API returned HTTP status ${statusRes.status}`);
    }

    const data = await statusRes.json();
    console.log(`[Watchdog] Status: ${data.colab_status || 'IDLE'}`);
    console.log(`[Watchdog] Active Tunnel: ${data.tunnel_url || 'None'}`);
    console.log(`[Watchdog] VRAM Used: ${data.vram_used_gb || 0} GB / 30.0 GB`);

    // 2. If cluster is ACTIVE, ping inference tunnel to keep warm
    if (data.colab_status === 'ACTIVE' && data.tunnel_url) {
      console.log(`[Watchdog] Ping inference gateway tunnel: ${data.tunnel_url}/v1/models`);
      try {
        const tunnelPing = await fetch(`${data.tunnel_url}/v1/models`, {
          headers: { 'x-api-key': SECRET_KEY }
        });
        if (tunnelPing.ok) {
          console.log(`[Watchdog] Tunnel Health Check: SUCCESS (200 OK)`);
        } else {
          console.warn(`[Watchdog Warning] Tunnel responded with status ${tunnelPing.status}`);
        }
      } catch (tunnelErr) {
        console.error(`[Watchdog Error] Tunnel connection error: ${tunnelErr.message}`);
      }
    }

    // 3. Trigger optional n8n automation webhook if configured
    if (N8N_WEBHOOK_URL) {
      console.log(`[Watchdog] Forwarding health metrics to n8n webhook: ${N8N_WEBHOOK_URL}`);
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp,
            source: 'github-runner-watchdog',
            platform_status: data.colab_status,
            vram_used_gb: data.vram_used_gb,
            tunnel_url: data.tunnel_url,
            healthy: true
          })
        });
        console.log(`[Watchdog] Successfully dispatched metrics to n8n.`);
      } catch (n8nErr) {
        console.error(`[Watchdog Error] n8n Webhook dispatch error: ${n8nErr.message}`);
      }
    }

    console.log(`[Watchdog] Watchdog health check completed successfully.`);
  } catch (err) {
    console.error(`[Watchdog Failure] Health check error: ${err.message}`);
    
    // Notify n8n failure if URL configured
    if (N8N_WEBHOOK_URL) {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp,
            source: 'github-runner-watchdog',
            healthy: false,
            error: err.message
          })
        });
      } catch {}
    }

    process.exit(1);
  }
}

runWatchdog();
