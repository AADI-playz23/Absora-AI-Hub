import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchMySessions } from '../lib/api.js';

export function Dashboard({ user, token, onSelectModel, onAuthRequired }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    if (!token) {
      onAuthRequired();
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMySessions(token);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [token]);

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={26} style={{ color: '#7c3aed' }} /> My Active SLM Sessions
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage your live 2-hour OpenAI-compatible model endpoints.
          </p>
        </div>

        <button onClick={loadSessions} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh Sessions
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading active sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <ShieldCheck size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Active Endpoints
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            You haven't launched any SLM model sessions yet. Browse the catalog to launch a model on demand.
          </p>
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Time Remaining
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                    {s.seconds_remaining ? `${Math.floor(s.seconds_remaining / 60)} minutes` : 'Active'}
                  </div>
                </div>
              </div>

              {s.tunnel_url && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Live Endpoint URL:
                  </div>
                  <div style={{
                    background: 'rgba(10, 15, 26, 0.8)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.88rem'
                  }}>
                    {s.tunnel_url}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
