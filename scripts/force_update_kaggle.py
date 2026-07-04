import os, sys, subprocess

os.environ["KAGGLE_USERNAME"] = "aadiplayz23"
os.environ["KAGGLE_KEY"] = "bb278d87c316904717bfc8673419311f"
os.environ["PYTHONUTF8"] = "1"

notebook_dir = os.path.abspath("notebooks")
print(f"[Force Update] Pushing notebook from {notebook_dir} to Kaggle...")

env = os.environ.copy()
env["PYTHONUTF8"] = "1"

try:
    res = subprocess.run(["kaggle", "kernels", "push", "-p", notebook_dir], capture_output=True, text=True, encoding="utf-8", errors="ignore", env=env)
    print("[Kaggle Output]:\n", res.stdout)
    if res.stderr:
        print("[Kaggle Stderr]:\n", res.stderr)
except Exception as e:
    print(f"[Error]: {e}")
