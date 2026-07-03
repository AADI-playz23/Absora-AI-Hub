import React from 'react';
import { Cpu, Clock, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ModelCard({ model, onSelect }) {
  const { id, name, description, vram_gb, context, category, badge, status } = model;

  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="badge-status badge-active">
            <span className="pulse-dot"></span> Active in VRAM
          </span>
        );
      case 'LOADING':
        return (
          <span className="badge-status badge-loading">
            <span className="pulse-dot"></span> Booting Colab...
          </span>
        );
      case 'QUEUED':
        return (
          <span className="badge-status badge-queued">
            Queued (VRAM Full)
          </span>
        );
      default:
        return (
          <span className="badge-status badge-idle">
            Ready to Launch
          </span>
        );
    }
  };

  return (
    <div 
      className="glass-panel glass-card-interactive" 
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Tag & Badge */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          {getStatusBadge()}
          {badge && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(124, 58, 237, 0.2)',
              color: '#c084fc',
              border: '1px solid rgba(124, 58, 237, 0.3)'
            }}>
              {badge}
            </span>
          )}
        </div>

        {/* Model Title */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {name}
        </h3>

        {/* Description */}
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px', minHeight: '42px' }}>
          {description}
        </p>

        {/* Specs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          padding: '12px',
          background: 'rgba(10, 15, 26, 0.6)',
          borderRadius: '10px',
          border: '1px solid var(--border-glass)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Cpu size={14} style={{ color: '#06b6d4' }} />
            <span>VRAM: <strong style={{ color: 'var(--text-primary)' }}>{vram_gb} GB</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Layers size={14} style={{ color: '#a78bfa' }} />
            <span>Ctx: <strong style={{ color: 'var(--text-primary)' }}>{context}</strong></span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(model)}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <span>{status === 'ACTIVE' ? 'Join Endpoint' : 'Launch Model'}</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
