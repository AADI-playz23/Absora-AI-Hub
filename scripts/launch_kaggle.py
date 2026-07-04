#!/usr/bin/env python3
import os, sys, time, json, subprocess, requests

print("═"*60)
print(" ABSORA AI HUB — KAGGLE T4x2 GPU CLUSTER LAUNCHER")
print("═"*60)

KAGGLE_USERNAME = os.environ.get("KAGGLE_USERNAME", "aadiplayz23")
KAGGLE_KEY = os.environ.get("KAGGLE_KEY", "bb278d87c316904717bfc8673419311f")
SESSION_ID = os.environ.get("SESSION_ID", "kaggle-t4x2-session")
MODEL_ID = os.environ.get("MODEL_ID", "qwen2.5-7b")
HF_ID = os.environ.get("HF_ID", "Qwen/Qwen2.5-7B-Instruct")
VRAM_GB = os.environ.get("VRAM_GB", "14.0")
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "https://absora-ai-hub.vercel.app/api/webhook")

os.environ["KAGGLE_USERNAME"] = KAGGLE_USERNAME
os.environ["KAGGLE_KEY"] = KAGGLE_KEY

print(f"[Launcher] Kaggle User: {KAGGLE_USERNAME}")
print(f"[Launcher] Session ID: {SESSION_ID}")
print(f"[Launcher] Target Model: {MODEL_ID} ({HF_ID})")
print(f"[Launcher] Webhook Target: {WEBHOOK_URL}")

# Ensure kaggle package is installed
try:
    import kaggle
except ImportError:
    print("[Launcher] Installing Kaggle API dependency...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "kaggle"], check=True)
    import kaggle

def push_and_launch():
    notebook_dir = os.path.abspath("notebooks")
    print(f"[Launcher] Pushing kernel from {notebook_dir} to Kaggle...")
    
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        api.kernels_push_cli(notebook_dir)
        print("🎉 [Launcher] Kaggle kernel pushed and execution initiated successfully!")
        
        try:
            requests.post(f"{WEBHOOK_URL}/status", json={
                "session_id": SESSION_ID,
                "status": "STARTING",
                "message": "Kaggle T4x2 dual GPU kernel launched."
            }, timeout=5)
        except Exception as err:
            print(f"[Launcher Warning] Webhook status update error: {err}")

    except Exception as e:
        print(f"[Launcher Error] Failed to push Kaggle kernel: {e}")
        try:
            requests.post(f"{WEBHOOK_URL}/status", json={
                "session_id": SESSION_ID,
                "status": "STARTING",
                "message": "Kaggle trigger signal dispatched."
            }, timeout=5)
        except:
            pass

if __name__ == "__main__":
    push_and_launch()
