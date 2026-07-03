// Trigger GitHub Actions workflow_dispatch via GitHub REST API

export async function triggerGitHubColabLaunch(env, { session_id, model_id, hf_id, vram_gb }) {
  const token = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER || "your-github-username";
  const repo = env.GITHUB_REPO || "Absora-AI-Hub";
  const workflow = "launch_session.yml";

  if (!token) {
    console.warn("GITHUB_TOKEN not set in environment! Skipping GitHub trigger.");
    return { success: false, reason: "GITHUB_TOKEN missing" };
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;
  const webhookUrl = env.WORKER_WEBHOOK_URL || "https://api.absora.workers.dev/webhook";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Absora-Worker",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          session_id,
          model_id,
          hf_id,
          vram_gb: String(vram_gb),
          webhook_url: webhookUrl
        }
      })
    });

    if (res.status === 204) {
      return { success: true };
    } else {
      const errText = await res.text();
      console.error(`GitHub Dispatch error (${res.status}): ${errText}`);
      return { success: false, reason: errText };
    }
  } catch (err) {
    console.error("GitHub Dispatch exception:", err);
    return { success: false, reason: err.message };
  }
}
