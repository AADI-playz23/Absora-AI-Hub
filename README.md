# ⚡ Absora AI Hub — On-Demand SLM Model Hosting Platform

Absora AI Hub is a full-stack, zero-cost AI model hosting platform. It uses **Google Colab (T4 16GB VRAM)** as an ephemeral compute worker, **Cloudflare Quick Tunnels** for instant public HTTPS endpoint exposure, **Cloudflare D1** for edge session tracking, **GitHub Actions** as the session orchestrator, and a **React + Vite** frontend deployed to Vercel.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│             Absora AI Hub Frontend  (Vercel)                 │
│  React 18 + Vite │ Glassmorphism Dark │ Live VRAM Visualizer │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS  /  SSE
┌──────────────────────────▼──────────────────────────────────┐
│           Cloudflare Workers — API Gateway                   │
│                                                              │
│  POST /auth/register   POST /auth/login                      │
│  GET  /models          GET  /models/status   (live VRAM)     │
│  POST /sessions/request GET  /sessions/mine  (tunnel URL)    │
│  POST /webhook/tunnel  POST /webhook/status  POST /stopped   │
│  GET  /sse/status                                            │
│                                                              │
│              ↕ Cloudflare D1 (Edge SQLite DB)                │
└───────────────────────┬──────────────────────────────────────┘
                        │ GitHub REST API (workflow_dispatch)
┌───────────────────────▼──────────────────────────────────────┐
│              GitHub Actions Runner  (Orchestrator)            │
│  - Triggered by CF Worker when user requests session          │
│  - Runs scripts/launch_colab.py via Selenium                 │
│  - Authenticates Google account stored in GitHub Secrets     │
│  - Executes notebooks/vllm_orchestrator.ipynb on Colab       │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│    Google Colab T4  (16 GB VRAM)  — Single-Cell vLLM Worker │
│                                                              │
│  FastAPI Gateway :8000  (Cloudflare Quick Tunnel)             │
│    ├── vLLM Process A :8001  (e.g., Qwen 2.5 1.5B)          │
│    ├── vLLM Process B :8002  (e.g., TinyLlama 1.1B)         │
│    └── vLLM Process C :8003  (e.g., DeepSeek R1 1.5B)       │
│                                                              │
│  Tunnel: https://xyz.trycloudflare.com (OpenAI API Format)   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

1. **Atomic Single-Cell Notebook**: Notebook code is consolidated into a single atomic cell to eliminate mid-session kernel drops or notebook interruptions.
2. **Dynamic Mid-Session VRAM Packing**: Multiple SLMs run side-by-side on ports `8001`, `8002`, `8003` under a single T4 GPU. New models are dynamically loaded mid-session without stopping active users.
3. **Cloudflare Quick Tunnel URL = API Endpoint**: Tunnel URLs serve as OpenAI-compatible endpoints directly (`/v1/chat/completions`).
4. **2-Hour Fixed Sessions**: Sessions auto-expire after 2 hours. Idle models are auto-unloaded after 15 minutes of zero traffic.
5. **Real-time SSE Dashboard**: Live Server-Sent Events stream GPU state and VRAM allocations directly to the browser.
6. **Built-in OpenAI Playground**: Test models interactively directly inside the web app.

---

## 📁 Repository Structure

```
Absora AI Hub/
├── catalog/
│   └── models.json                # 10 SLMs metadata (Qwen, Gemma, DeepSeek, TinyLlama, etc.)
├── notebooks/
│   └── vllm_orchestrator.ipynb    # Single-cell Colab T4 worker with vLLM & cloudflared
├── worker/                        # Cloudflare Worker API Gateway (Hono)
│   ├── src/
│   │   ├── routes/                # auth, models, sessions, webhook, sse
│   │   ├── db.js, github.js, jwt.js
│   │   └── index.js
│   ├── wrangler.toml
│   └── package.json
├── frontend/                      # React 18 + Vite Frontend (Vercel)
│   ├── src/
│   │   ├── components/            # VramDashboard, ModelCard, SessionPanel, PlaygroundChat
│   │   ├── pages/                 # Home, ModelDetail, Dashboard, Auth
│   │   └── lib/                   # api.js, sse.js
│   └── package.json
├── .github/workflows/
│   └── launch_session.yml         # GitHub Actions workflow dispatch launcher
├── scripts/
│   └── launch_colab.py            # Headless browser script for Actions
├── schema.sql                     # Cloudflare D1 SQL schema
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Cloudflare Worker Setup & Database Migration
```bash
cd worker
npm install

# Set your Cloudflare API token in shell environment
# PowerShell: $env:CLOUDFLARE_API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN"
# Bash: export CLOUDFLARE_API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN"

# Execute database migration on D1 (database_id: ad8b5464-07df-42d1-8860-130a4c533cb9)
npx wrangler d1 execute absora-db --remote --file=../schema.sql

# Deploy worker to Cloudflare Workers
npm run deploy
```

### 2. GitHub Secrets Setup
In your GitHub Repository settings (`Settings -> Secrets and variables -> Actions`), add the following secrets:
- `COLAB_EMAIL`: Google Account Email for Colab
- `COLAB_PASS`: Google Account Password for Colab
- `GITHUB_TOKEN`: GitHub Personal Access Token (repo & workflow permissions)

### 3. Frontend Setup
```bash
cd frontend
npm install

# Run Vite dev server
npm run dev
```

Visit `http://localhost:5173` to explore the catalog, log in, launch models, and run OpenAI-compatible inference queries!

---

## ⚡ OpenAI API Example

Once your session is active, invoke models using any standard OpenAI client or cURL:

```bash
curl https://<your-tunnel-id>.trycloudflare.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-1.5b",
    "messages": [
      {"role": "user", "content": "Explain neural networks in simple terms."}
    ],
    "temperature": 0.7
  }'
```
