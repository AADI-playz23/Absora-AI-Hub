import React, { useState, useEffect } from 'react';
import { Check, Copy, ExternalLink, ShieldCheck, Clock, Terminal, Key } from 'lucide-react';

export function SessionPanel({ session, model }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const apiKey = session?.api_key || 'sk-absora-xxxx';
  const proxyEndpoint = session?.proxy_endpoint || `${window.location.origin}/api/v1/chat/completions`;
  const modelName = model?.name || session?.model_id;

  // Countdown timer for 2-hour session
  useEffect(() => {
    if (!session?.expires_at) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, session.expires_at - now);

      if (remaining <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.expires_at]);

  const curlExample = `curl ${proxyEndpoint} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model?.id || session?.model_id}",
    "messages": [{"role": "user", "content": "Explain quantum computing in 2 sentences."}]
  }'`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(proxyEndpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active NIM/OpenRouter Style Endpoint
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {modelName}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.85rem',
          color: '#fbbf24',
          fontWeight: 700
        }}>
          <Clock size={15} />
          <span>Session Expires in: {timeLeft || '2h 00m'}</span>
        </div>
      </div>

      {/* Credentials Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* API Key */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Key size={14} style={{ color: '#fbbf24' }} /> ABSORA API KEY
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={apiKey}
              style={{
                flex: 1,
                background: 'rgba(10, 15, 26, 0.9)',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#fbbf24',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            <button onClick={handleCopyKey} className="btn-secondary" style={{ padding: '0 12px' }}>
              {copiedKey ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Unified Proxy Endpoint */}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <ExternalLink size={14} style={{ color: '#06b6d4' }} /> UNIFIED PROXY ENDPOINT
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              readOnly
              value={proxyEndpoint}
              style={{
                flex: 1,
                background: 'rgba(10, 15, 26, 0.9)',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            <button onClick={handleCopyEndpoint} className="btn-secondary" style={{ padding: '0 12px' }}>
              {copiedEndpoint ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick cURL Snippet */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} style={{ color: '#a78bfa' }} /> OPENAI CLIENT / cURL CODE EXAMPLE
          </label>
          <button onClick={handleCopyCurl} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedCurl ? 'Copied Snippet' : 'Copy cURL'}</span>
          </button>
        </div>
        <pre className="code-snippet">
          {curlExample}
        </pre>
      </div>
    </div>
  );
}
