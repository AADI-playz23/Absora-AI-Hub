import React from 'react';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export function QueuePanel({ queuePosition = 1, modelName }) {
  return (
    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            VRAM Capacity Reached — You are in Queue
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Colab T4 16GB VRAM is currently fully allocated by active models.
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'rgba(10, 15, 26, 0.7)',
        borderRadius: '12px',
        border: '1px solid var(--border-glass)'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Model</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{modelName}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Queue Position</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>#{queuePosition}</div>
        </div>
      </div>

      <div style={{ marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <RefreshCw size={14} className="animate-spin" style={{ color: '#06b6d4' }} />
        <span>Live updates active via Server-Sent Events. Endpoint will auto-activate when VRAM frees up.</span>
      </div>
    </div>
  );
}
