import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Key, Copy, Check, RefreshCw, Rocket, AlertTriangle, Terminal, Code, Cpu } from 'lucide-react';
import { fetchMySessions, requestSession, regenerateApiKey } from '../lib/api.js';

export function Dashboard({ user, token, onSelectModel, onAuthRequired }) {
  const [activeTab, setActiveTab] = useState('apis'); // 'apis' | 'sessions'
  const [sessions, setSessions] = useState([]);
  const [colabStatus, setColabStatus] = useState('IDLE');
  const [tunnelUrl, setTunnelUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [userApiKey, setUserApiKey] = useState(user?.api_key || 'absora_sk_sample123456');

  const currentEndpoint = 'https://absora-ai-hub.vercel.app/api/absora/v1/chat/completions';

  const loadSessions = async () => {
    if (!token) {
      onAuthRequired();
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMySessions(token);
      setSessions(data.sessions || []);
      setColabStatus(data.colab_status || 'IDLE');
      if (data.tunnel_url) setTunnelUrl(data.tunnel_url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [token]);

  const handleLaunchSession = async () => {
    if (!token) return onAuthRequired();
    setLaunching(true);
    try {
      const res = await requestSession('qwen2.5-7b', token);
      if (res.api_key) setUserApiKey(res.api_key);
      await loadSessions();
      alert(res.message || 'Launch initiated! Kaggle T4x2 cluster starting up...');
    } catch (err) {
      alert('Launch failed: ' + err.message);
    } finally {
      setLaunching(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to regenerate your API Key? Old keys will stop working.')) return;
    try {
      const res = await regenerateApiKey(token);
      if (res.api_key) {
        setUserApiKey(res.api_key);
        alert('API Key regenerated successfully!');
      }
    } catch (err) {
      alert('Regeneration failed: ' + err.message);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={26} style={{ color: '#7c3aed' }} /> Developer Dashboard & APIs
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage your API key, live model endpoints, and Kaggle T4x2 cluster state.
          </p>
        </div>

        <button onClick={loadSessions} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh State
        </button>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-glass)', marginBottom: '28px', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('apis')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'apis' ? '3px solid #7c3aed' : '3px solid transparent',
            color: activeTab === 'apis' ? '#a78bfa' : 'var(--text-secondary)',
            fontWeight: activeTab === 'apis' ? 700 : 500,
            fontSize: '1rem',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Key size={18} /> APIs & Credentials
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sessions' ? '3px solid #7c3aed' : '3px solid transparent',
            color: activeTab === 'sessions' ? '#a78bfa' : 'var(--text-secondary)',
            fontWeight: activeTab === 'sessions' ? 700 : 500,
            fontSize: '1rem',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Cpu size={18} /> Active Sessions ({sessions.length})
        </button>
      </div>

      {/* ── APIS TAB ── */}
      {activeTab === 'apis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* IDLE STATE BANNER */}
          {colabStatus === 'IDLE' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '20px 24px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>
                    Models are currently IDLE. Please click 'Launch Session' to use them
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Kaggle T4x2 GPU cluster is offline to conserve weekly quota. Click launch to boot vLLM serving.
                  </p>
                </div>
              </div>

              <button
                onClick={handleLaunchSession}
                disabled={launching}
                className="btn-primary"
                style={{ fontSize: '0.9rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Rocket size={16} /> {launching ? 'Launching Kaggle T4x2...' : 'Launch Session'}
              </button>
            </div>
          )}

          {/* ACTIVE / STARTING STATE BANNER */}
          {colabStatus === 'STARTING' && (
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fde047', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw className="spin" size={18} /> Kaggle T4x2 Cluster Booting...
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                GitHub Actions dispatched Kaggle kernel execution. Endpoint will be ACTIVE in 1-2 minutes.
              </p>
            </div>
          )}

          {colabStatus === 'ACTIVE' && (
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#86efac', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-green" /> Kaggle T4x2 GPU Cluster is ACTIVE
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                vLLM multi-user serving engine is live on port 8000. Send API calls below.
              </p>
            </div>
          )}

          {/* API KEY & ENDPOINT BOX */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} style={{ color: '#a78bfa' }} /> Platform API Key & Endpoint
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              
              {/* API Key Box */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Your Absora API Key
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    readOnly
                    value={userApiKey}
                    style={{
                      flex: 1,
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#a78bfa',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(userApiKey, 'key')}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {copiedKey ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />} Copy
                  </button>
                  <button
                    onClick={handleRegenerateKey}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', color: '#f87171' }}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Endpoint Box */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Unified OpenAI API Base URL
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    readOnly
                    value={currentEndpoint}
                    style={{
                      flex: 1,
                      background: 'rgba(10, 15, 26, 0.9)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#38bdf8',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(currentEndpoint, 'url')}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {copiedUrl ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />} Copy
                  </button>
                </div>
              </div>

            </div>

            {/* MANDATORY NOTICE BOX */}
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={18} />
              ⚠️ Note: This API endpoint/tunnel URL will refresh after each 30-minute compute session.
            </div>
          </div>

          {/* CODE SNIPPETS EXAMPLES */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={18} style={{ color: '#a78bfa' }} /> OpenAI SDK & cURL Integration Snippets
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  cURL Command:
                </div>
                <pre style={{
                  background: 'rgba(5, 8, 15, 0.95)',
                  padding: '14px',
                  borderRadius: '8px',
                  color: '#34d399',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  overflowX: 'auto'
                }}>
{`curl ${currentEndpoint} \\
  -H "Authorization: Bearer ${userApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen2.5-7b",
    "messages": [{"role": "user", "content": "Explain quantum computing in simple terms."}]
  }'`}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Python (OpenAI Client):
                </div>
                <pre style={{
                  background: 'rgba(5, 8, 15, 0.95)',
                  padding: '14px',
                  borderRadius: '8px',
                  color: '#60a5fa',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  overflowX: 'auto'
                }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="${userApiKey}",
    base_url="https://absora-ai-hub.vercel.app/api/absora/v1"
)

response = client.chat.completions.create(
    model="deepseek-r1-7b",
    messages=[{"role": "user", "content": "Write a Python script for web scraping."}]
)

print(response.choices[0].message.content)`}
                </pre>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {activeTab === 'sessions' && (
        <div>
          {loading ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading active sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Cpu size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Active Sessions
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Launch a session to spin up the Kaggle T4x2 GPU cluster.
              </p>
              <button onClick={handleLaunchSession} disabled={launching} className="btn-primary">
                <Rocket size={16} /> Launch Kaggle T4x2 Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sessions.map(s => (
                <div key={s.id} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className={`badge-status ${s.status === 'ACTIVE' ? 'badge-active' : 'badge-idle'}`}>
                          {s.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: {s.id}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Model: {s.model_id}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Cluster Hardware
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>
                        Kaggle Dual T4 (30GB VRAM)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
