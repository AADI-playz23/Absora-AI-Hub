#!/usr/bin/env python3
import os, sys, subprocess, requests

os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

print("="*60)
print(" ABSORA AI HUB - KAGGLE T4x2 GPU CLUSTER LAUNCHER")
print("="*60)

# ── Credentials must come from environment variables only ──────────────────────
# Set these as repo secrets in GitHub Actions or in your local .env:
#   KAGGLE_USERNAME = your Kaggle username
#   KAGGLE_KEY      = your Kaggle API key
KAGGLE_USERNAME = os.environ.get("KAGGLE_USERNAME")
KAGGLE_KEY      = os.environ.get("KAGGLE_KEY")

if not KAGGLE_USERNAME or not KAGGLE_KEY:
    print("[Launcher] ERROR: KAGGLE_USERNAME and KAGGLE_KEY environment variables are required.")
    print("[Launcher] Set them as GitHub Actions secrets or in your local environment.")
    sys.exit(1)

SESSION_ID   = os.environ.get("SESSION_ID",   "kaggle-t4x2-session")
MODEL_ID     = os.environ.get("MODEL_ID",     "qwen2.5-7b")
HF_ID        = os.environ.get("HF_ID",        "Qwen/Qwen2.5-7B-Instruct-AWQ")
WEBHOOK_URL  = os.environ.get("WEBHOOK_URL",  "https://absora-ai-hub.vercel.app/api/webhook")

os.environ["KAGGLE_USERNAME"] = KAGGLE_USERNAME
os.environ["KAGGLE_KEY"]      = KAGGLE_KEY

print(f"[Launcher] Kaggle User:    {KAGGLE_USERNAME}")
print(f"[Launcher] Session ID:     {SESSION_ID}")
print(f"[Launcher] Target Model:   {MODEL_ID} ({HF_ID})")
print(f"[Launcher] Webhook Target: {WEBHOOK_URL}")

try:
    import kaggle
except ImportError:
    print("[Launcher] Installing Kaggle API dependency...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "kaggle"], check=True)

def push_and_launch():
    notebook_dir = os.path.abspath("notebooks")
    print(f"[Launcher] Pushing kernel from {notebook_dir} via Kaggle CLI...")

    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"

    try:
        res = subprocess.run(
            ["kaggle", "kernels", "push", "-p", notebook_dir],
            capture_output=True, text=True,
            encoding="utf-8", errors="ignore",
            env=env, check=True
        )
        print("[Launcher] Kaggle CLI Output:\n", res.stdout)
        print("[SUCCESS] Kaggle kernel pushed and execution initiated!")

        try:
            requests.post(f"{WEBHOOK_URL}/status", json={
                "session_id": SESSION_ID,
                "status": "STARTING",
                "message": "Kaggle T4x2 dual GPU kernel launched."
            }, timeout=5)
        except Exception as err:
            print(f"[Launcher Warning] Webhook update failed: {err}")

    except subprocess.CalledProcessError as cpe:
        print(f"[Launcher Error] Kaggle CLI Push Failed:\n{cpe.stderr}")
        try:
            requests.post(f"{WEBHOOK_URL}/status", json={
                "session_id": SESSION_ID,
                "status": "ERROR",
                "message": "Kaggle kernel push failed. Check secrets and kernel slug."
            }, timeout=5)
        except:
            pass
        sys.exit(1)

if __name__ == "__main__":
    push_and_launch()
