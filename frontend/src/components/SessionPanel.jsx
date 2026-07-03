import React, { useState, useEffect } from 'react';
import { Check, Copy, ExternalLink, ShieldCheck, Clock, Terminal } from 'lucide-react';

export function SessionPanel({ session, model }) {
  const [copiedTunnel, setCopiedTunnel] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const tunnelUrl = session?.tunnel_url;
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

  const curlExample = `curl ${tunnelUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model?.id || session?.model_id}",
    "messages": [{"role": "user", "content": "Explain quantum computing in 2 sentences."}]
  }'`;

  const handleCopyTunnel = () => {
    if (!tunnelUrl) return;
    navigator.clipboard.writeText(tunnelUrl);
    setCopiedTunnel(true);
    setTimeout(() => setCopiedTunnel(false), 2000);
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
              Active Endpoint Ready
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

      {/* Cloudflare Quick Tunnel Endpoint Display */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
          LIVE OPENAI-COMPATIBLE TUNNEL ENDPOINT (YOUR API KEY & ENDPOINT)
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            readOnly
            value={tunnelUrl || 'Waiting for live tunnel registration...'}
            style={{
              flex: 1,
              background: 'rgba(10, 15, 26, 0.9)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button onClick={handleCopyTunnel} className="btn-primary" style={{ padding: '0 16px' }}>
            {copiedTunnel ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedTunnel ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Quick cURL Snippet */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} style={{ color: '#a78bfa' }} /> QUICK cURL EXAMPLE
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
