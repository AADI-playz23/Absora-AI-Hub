import React from 'react';
import { Zap, Server, LayoutDashboard, User, LogOut } from 'lucide-react';

export function Navbar({ activePage, setActivePage, user, onLogout }) {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      background: 'rgba(8, 11, 20, 0.75)',
      borderBottom: '1px solid var(--border-glass)',
      padding: '14px 0'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Brand */}
        <div 
          onClick={() => setActivePage('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)'
          }}>
            <Zap size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Absora AI Hub
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              On-Demand SLM Endpoints
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActivePage('home')}
            className={activePage === 'home' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <Server size={16} /> Catalog
          </button>

          <button
            onClick={() => setActivePage('dashboard')}
            className={activePage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <LayoutDashboard size={16} /> My Sessions
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: '#06b6d4' }} />
                {user.username}
              </div>
              <button 
                onClick={onLogout} 
                className="btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActivePage('auth')}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.88rem', marginLeft: '12px' }}
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
