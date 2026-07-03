import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { Home } from './pages/Home.jsx';
import { ModelDetail } from './pages/ModelDetail.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Auth } from './pages/Auth.jsx';
import { useSSE } from './lib/sse.js';

export function App() {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'detail' | 'dashboard' | 'auth'
  const [selectedModel, setSelectedModel] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('absora_token') || null);

  const sseData = useSSE();

  useEffect(() => {
    const savedUser = localStorage.getItem('absora_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
  }, [token]);

  const handleAuthSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('absora_user', JSON.stringify(userData));
    localStorage.setItem('absora_token', jwtToken);
    setActivePage('home');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('absora_user');
    localStorage.removeItem('absora_token');
    setActivePage('home');
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setActivePage('detail');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '32px 24px 0' }}>
        {activePage === 'home' && (
          <Home
            sseData={sseData}
            onSelectModel={handleSelectModel}
          />
        )}

        {activePage === 'detail' && selectedModel && (
          <ModelDetail
            model={selectedModel}
            user={user}
            token={token}
            onBack={() => setActivePage('home')}
            onAuthRequired={() => setActivePage('auth')}
          />
        )}

        {activePage === 'dashboard' && (
          <Dashboard
            user={user}
            token={token}
            onSelectModel={handleSelectModel}
            onAuthRequired={() => setActivePage('auth')}
          />
        )}

        {activePage === 'auth' && (
          <Auth onAuthSuccess={handleAuthSuccess} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '24px 0',
        marginTop: '60px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            © {new Date().getFullYear()} Absora AI Hub. On-Demand SLM Endpoints on Colab T4.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Colab T4 (16GB VRAM)</span>
            <span>Cloudflare Quick Tunnel</span>
            <span>Cloudflare D1</span>
            <span>Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
