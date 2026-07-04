import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Key, Copy, Check, RefreshCw, Rocket, AlertTriangle, Code, Cpu, ShieldCheck, Terminal, Eye, EyeOff, Activity, Zap } from 'lucide-react';
import { fetchMySessions, requestSession, regenerateApiKey } from '../lib/api.js';

const API_BASE = '/api';

export function Dashboard({ user, token, onSelectModel, onAuthRequired }) {
  const [activeTab, setActiveTab]     = useState('apis');
  const [sessions, setSessions]       = useState([]);
  const [colabStatus, setColabStatus] = useState('IDLE');
  const [loading, setLoading]         = useState(true);
  const [launching, setLaunching]     = useState(false);
  const [copiedKey, setCopiedKey]     = useState(false);
  const [copiedUrl, setCopiedUrl]     = useState(false);
  const [showKey, setShowKey]         = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [verifyMsg, setVerifyMsg]     = useState('');
  const [userApiKey, setUserApiKey]   = useState(user?.api_key || '');

  const currentEndpoint = 'https://absora-ai-hub.vercel.app/api/absora/v1/chat/completions';
  const maskedKey = userApiKey
    ? userApiKey.slice(0, 12) + '••••••••••••••••••••' + userApiKey.slice(-4)
    : '—';

  const loadSessions = async () => {
    if (!token) { onAuthRequired(); return; }
    setLoading(true);
    try {
      const data = await fetchMySessions(token);
      setSessions(data.sessions || []);
      setColabStatus(data.colab_status || 'IDLE');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, [token]);

  // Update key if user changes
  useEffect(() => {
    if (user?.api_key) setUserApiKey(user.api_key);
  }, [user]);

  const handleLaunchSession = async () => {
    if (!token) return onAuthRequired();
    setLaunching(true);
    try {
      const res = await requestSession('qwen2.5-7b', token);
      if (res.api_key) setUserApiKey(res.api_key);
      await loadSessions();
    } catch (err) {
      alert('Launch failed: ' + err.message);
    } finally {
      setLaunching(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!token) return;
    if (!confirm('Regenerate API key? Your old key will stop working.')) return;
    try {
      const res = await regenerateApiKey(token);
      if (res.api_key) {
        setUserApiKey(res.api_key);
        setVerifyStatus(null);
      }
    } catch (err) {
      alert('Regeneration failed: ' + err.message);
    }
  };

  const handleVerify = async () => {
    if (!userApiKey) return;
    setVerifyStatus('loading');
    setVerifyMsg('');
    try {
      // Verify by calling /api/absora/v1/models with the key
      const res = await fetch(`${API_BASE}/absora/v1/models`, {
        headers: { 'Authorization': `Bearer ${userApiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        const modelList = (data.data || []).map(m => m.id).join(', ') || 'none loaded yet';
        setVerifyStatus('ok');
        setVerifyMsg(`✓ API key is valid! Active models: ${modelList}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setVerifyStatus('error');
        setVerifyMsg(`✗ ${err.error?.message || `HTTP ${res.status} — key rejected`}`);
      }
    } catch (e) {
      setVerifyStatus('error');
      setVerifyMsg('✗ Network error — could not reach API');
    }
  };

  const copy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
    else                { setCopiedUrl(true);  setTimeout(() => setCopiedUrl(false),  2000); }
  };

  // ── TAB STYLES ─────────────────────────────────────────────────────────────
  const tabStyle = (tab) => ({
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid #7c3aed' : '3px solid transparent',
    color: activeTab === tab ? '#a78bfa' : 'var(--text-secondary)',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '1rem',
    padding: '10px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ paddingBottom: '60px' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={26} style={{ color: '#7c3aed' }} /> Developer Dashboard
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Your API key, live endpoints, and GPU cluster controls.
          </p>
        </div>
        <button onClick={loadSessions} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── HERO API KEY CARD ────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.10) 100%)',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* background glow */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)'
          }}>
            <Key size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Your Absora API Key
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {user?.username ? `Account: ${user.username}` : 'Sign in to see your key'}
            </div>
          </div>

          {/* Verify badge */}
          {verifyStatus === 'ok' && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
              borderRadius: '30px', padding: '4px 14px', color: '#86efac', fontSize: '0.82rem', fontWeight: 700
            }}>
              <ShieldCheck size={14} /> Verified
            </div>
          )}
          {verifyStatus === 'error' && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '30px', padding: '4px 14px', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700
            }}>
              <AlertTriangle size={14} /> Invalid
            </div>
          )}
        </div>

        {/* API Key row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{
            flex: 1,
            background: 'rgba(5, 8, 20, 0.75)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#c4b5fd',
            letterSpacing: '0.04em',
            userSelect: 'all',
            wordBreak: 'break-all',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {userApiKey
              ? (showKey ? userApiKey : maskedKey)
              : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Sign in to reveal your API key</span>
            }
          </div>

          {userApiKey && (<>
            <button
              onClick={() => setShowKey(v => !v)}
              className="btn-secondary"
              title={showKey ? 'Hide key' : 'Show key'}
              style={{ padding: '12px' }}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={() => copy(userApiKey, 'key')}
              className="btn-secondary"
              style={{ padding: '12px', minWidth: '100px', fontSize: '0.88rem' }}
            >
              {copiedKey ? <><Check size={15} style={{ color: '#22c55e' }} /> Copied!</> : <><Copy size={15} /> Copy</>}
            </button>
          </>)}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={!userApiKey || verifyStatus === 'loading'}
            className="btn-primary"
            style={{ fontSize: '0.88rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {verifyStatus === 'loading'
              ? <><RefreshCw size={15} className="spin" /> Verifying...</>
              : <><Activity size={15} /> Verify Key</>
            }
          </button>

          <button
            onClick={handleRegenerateKey}
            disabled={!token}
            className="btn-secondary"
            style={{ fontSize: '0.88rem', color: '#f87171' }}
          >
            <RefreshCw size={14} /> Regenerate
          </button>

          {colabStatus === 'IDLE' && (
            <button
              onClick={handleLaunchSession}
              disabled={launching}
              className="btn-primary"
              style={{ fontSize: '0.88rem', padding: '10px 20px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              <Rocket size={15} /> {launching ? 'Launching...' : 'Launch GPU Session'}
            </button>
          )}
          {colabStatus === 'STARTING' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#fde047', fontSize: '0.88rem', fontWeight: 700 }}>
              <RefreshCw size={15} className="spin" /> Cluster booting…
            </div>
          )}
          {colabStatus === 'ACTIVE' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#86efac', fontSize: '0.88rem', fontWeight: 700 }}>
              <span className="pulse-green" /> Cluster ACTIVE
            </div>
          )}
        </div>

        {/* Verify feedback */}
        {verifyMsg && (
          <div style={{
            marginTop: '14px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: verifyStatus === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${verifyStatus === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: verifyStatus === 'ok' ? '#86efac' : '#fca5a5',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          }}>
            {verifyMsg}
          </div>
        )}
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-glass)', marginBottom: '28px' }}>
        <button style={tabStyle('apis')} onClick={() => setActiveTab('apis')}>
          <Code size={16} /> API & Endpoint
        </button>
        <button style={tabStyle('sessions')} onClick={() => setActiveTab('sessions')}>
          <Cpu size={16} /> Sessions ({sessions.length})
        </button>
      </div>

      {/* ── API TAB ───────────────────────────────────────────────────────────── */}
      {activeTab === 'apis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Endpoint box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: '#06b6d4' }} /> OpenAI-Compatible Endpoint
            </h3>

            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              BASE URL
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                readOnly value={currentEndpoint}
                style={{
                  flex: 1, background: 'rgba(10,15,26,0.9)',
                  border: '1px solid var(--border-glass)', borderRadius: '8px',
                  padding: '10px 14px', color: '#38bdf8',
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem'
                }}
              />
              <button onClick={() => copy(currentEndpoint, 'url')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                {copiedUrl ? <Check size={15} style={{ color: '#22c55e' }} /> : <Copy size={15} />} Copy
              </button>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> Tunnel URL refreshes after each 2-hour GPU session. API key stays permanent.
            </div>
          </div>

          {/* Code snippets */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} style={{ color: '#a78bfa' }} /> Integration Snippets
            </h3>

            <div style={{ marginBottom: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>cURL</div>
            <pre style={{ background: 'rgba(5,8,15,0.95)', padding: '16px', borderRadius: '10px', color: '#34d399', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', overflowX: 'auto', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
{`curl ${currentEndpoint} \\
  -H "Authorization: Bearer ${userApiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen2.5-7b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
            </pre>

            <div style={{ marginBottom: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Python (OpenAI SDK)</div>
            <pre style={{ background: 'rgba(5,8,15,0.95)', padding: '16px', borderRadius: '10px', color: '#60a5fa', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)' }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="${userApiKey || 'YOUR_API_KEY'}",
    base_url="https://absora-ai-hub.vercel.app/api/absora/v1"
)

response = client.chat.completions.create(
    model="qwen2.5-7b",  # or: deepseek-r1-1.5b | phi3.5-mini
    messages=[{"role": "user", "content": "Explain recursion simply."}]
)
print(response.choices[0].message.content)`}
            </pre>
          </div>
        </div>
      )}

      {/* ── SESSIONS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div>
          {loading ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Cpu size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Active Sessions
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Launch a session to spin up the T4x2 GPU cluster.
              </p>
              <button onClick={handleLaunchSession} disabled={launching} className="btn-primary">
                <Rocket size={16} /> {launching ? 'Launching...' : 'Launch Session'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sessions.map(s => (
                <div key={s.id} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className={`badge-status ${s.status === 'ACTIVE' ? 'badge-active' : 'badge-idle'}`}>
                          {s.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {s.id}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Model: {s.model_id}
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hardware</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#a78bfa' }}>
                        T4x2 Dual GPU (32 GB)
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
