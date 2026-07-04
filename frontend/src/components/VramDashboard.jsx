import React from 'react';
import { Cpu, Zap } from 'lucide-react';

export function VramDashboard({ vram, colabStatus, loadedModels = [] }) {
  const total = 16.0;
  const used = Math.min(total, vram?.used || (loadedModels.reduce((acc, m) => acc + (m.vram_gb || 7.5), 0)));
  const free = Math.max(0, total - used);
  const usedPct = ((used / total) * 100).toFixed(1);

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dual Parallel GPU Inference Cluster (16 GB VRAM Pool)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Shared VRAM & Concurrent Model Memory
              <span className={`badge-status ${colabStatus === 'ACTIVE' ? 'badge-active' : colabStatus === 'STARTING' ? 'badge-loading' : 'badge-idle'}`}>
                <span className="pulse-dot"></span> {colabStatus}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total VRAM Used</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
              {used.toFixed(1)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {total} GB ({usedPct}%)</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Available Free VRAM</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
              {free.toFixed(1)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual VRAM Progress Bar */}
      <div style={{ width: '100%', height: '14px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '7px', overflow: 'hidden', display: 'flex', border: '1px solid var(--border-glass)' }}>
        {loadedModels.map((m, idx) => {
          const mPct = (((m.vram_gb || 7.5) / total) * 100).toFixed(1);
          const colors = ['#7c3aed', '#06b6d4', '#10b981'];
          const color = colors[idx % colors.length];
          return (
            <div
              key={m.model_id || idx}
              title={`${m.model_id}: ${m.vram_gb || 7.5} GB`}
              style={{
                width: `${mPct}%`,
                height: '100%',
                background: color,
                transition: 'width 0.4s ease',
                boxShadow: `0 0 10px ${color}`
              }}
            />
          );
        })}
      </div>

      {/* Active Model Chips */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
        {loadedModels.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No models currently loaded. Click 'Launch Session' to spin up parallel GPU engine.</span>
        ) : (
          loadedModels.map((m, idx) => (
            <div key={m.model_id || idx} style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Zap size={13} style={{ color: '#06b6d4' }} />
              <span>{m.model_id}</span>
              <span style={{ opacity: 0.6 }}>(Parallel Slot {idx + 1} — {m.vram_gb || 7.5} GB)</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
