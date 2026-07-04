import React from 'react';
import { Cpu, Zap } from 'lucide-react';

export function VramDashboard({ vram, colabStatus, loadedModels = [] }) {
  const total = 30.0;
  const used = Math.min(total, vram?.used || (loadedModels.length * 14.0));
  const free = Math.max(0, total - used);
  const usedPct = ((used / total) * 100).toFixed(1);

  // Split loaded models by GPU slot (GPU 0 & GPU 1)
  const gpu0Model = loadedModels.find(m => m.gpu_index === 0 || loadedModels.indexOf(m) === 0);
  const gpu1Model = loadedModels.find(m => m.gpu_index === 1 || loadedModels.indexOf(m) === 1);

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kaggle T4x2 Dual GPU Cluster (30 GB VRAM Pool)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              GPU VRAM & Physical Slot Allocation
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

      {/* Dual Physical GPU Cards Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        
        {/* GPU 0 */}
        <div style={{
          background: 'rgba(10, 15, 26, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span>T4 GPU Slot 0 (15 GB)</span>
            <span style={{ color: gpu0Model ? '#a78bfa' : '#34d399' }}>
              {gpu0Model ? `${gpu0Model.model_id} (14 GB)` : '15 GB Free'}
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
            <div style={{
              width: gpu0Model ? '93%' : '0%',
              height: '100%',
              background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* GPU 1 */}
        <div style={{
          background: 'rgba(10, 15, 26, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span>T4 GPU Slot 1 (15 GB)</span>
            <span style={{ color: gpu1Model ? '#a78bfa' : '#34d399' }}>
              {gpu1Model ? `${gpu1Model.model_id} (14 GB)` : '15 GB Free'}
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
            <div style={{
              width: gpu1Model ? '93%' : '0%',
              height: '100%',
              background: 'linear-gradient(90deg, #06b6d4, #10b981)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

      </div>

      {/* Active Model Chips */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
        {loadedModels.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No models currently loaded. Click 'Launch Session' to spin up Kaggle T4x2 hardware.</span>
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
              <span style={{ opacity: 0.6 }}>(GPU {m.gpu_index ?? idx} — {m.vram_gb || 14.0} GB)</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
