import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, Layers, Zap, Loader2, Play } from 'lucide-react';
import { requestSession, fetchMySessions } from '../lib/api.js';
import { SessionPanel } from '../components/SessionPanel.jsx';
import { QueuePanel } from '../components/QueuePanel.jsx';
import { PlaygroundChat } from '../components/PlaygroundChat.jsx';

export function ModelDetail({ model, user, token, onBack, onAuthRequired }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user already has an active session for this model
  useEffect(() => {
    if (!token) return;
    fetchMySessions(token)
      .then(data => {
        const active = data.sessions?.find(s => s.model_id === model.id);
        if (active) {
          setSession(active);
        }
      })
      .catch(console.error);
  }, [token, model.id]);

  const handleLaunch = async () => {
    if (!user || !token) {
      onAuthRequired();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestSession(model.id, token);
      setSession(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Back Button */}
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '24px', fontSize: '0.85rem' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      {/* Model Overview Panel */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span className="badge-status badge-active">
                <span className="pulse-dot"></span> {model.category}
              </span>
              {model.badge && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.2)', color: '#c084fc' }}>
                  {model.badge}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
              {model.name}
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: '1.6' }}>
              {model.description}
            </p>
          </div>

          {!session && (
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
              <span>{loading ? 'Booting Model...' : 'Launch On-Demand Endpoint'}</span>
            </button>
          )}
        </div>

        {/* Specs breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-glass)'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>HuggingFace ID</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{model.hf_id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Required VRAM</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{model.vram_gb} GB (T4 FP16)</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Context Length</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{model.context} Tokens</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Execution Backend</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#34d399' }}>vLLM + Colab T4</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Session Active View */}
      {session?.status === 'ACTIVE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <SessionPanel session={session} model={model} />
          <PlaygroundChat tunnelUrl={session.tunnel_url} modelId={model.id} />
        </div>
      )}

      {/* Session Queued View */}
      {session?.status === 'QUEUED' && (
        <QueuePanel queuePosition={session.queue_position || 1} modelName={model.name} />
      )}

      {/* Session Starting / Loading View */}
      {(session?.status === 'STARTING' || session?.status === 'LOADING') && (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#06b6d4', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Launching Colab T4 Worker via GitHub Actions...
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            The runner is booting the single-cell Colab worker, configuring cloudflared, and starting vLLM for {model.name}. Endpoint will activate automatically!
          </p>
        </div>
      )}

    </div>
  );
}
