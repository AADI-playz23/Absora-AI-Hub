import React, { useState } from 'react';
import { Search, Sparkles, Server } from 'lucide-react';
import { VramDashboard } from '../components/VramDashboard.jsx';
import { ModelCard } from '../components/ModelCard.jsx';

const DEFAULT_CATALOG = [
  {
    "id": "qwen2.5-7b",
    "name": "Qwen 2.5 7B Instruct",
    "hf_id": "Qwen/Qwen2.5-7B-Instruct",
    "vram_gb": 8.0,
    "context": "32768",
    "category": "SLM",
    "badge": "Primary 7B",
    "description": "Alibaba Cloud's flagship 7B parameter model optimized for dual-model parallel GPU hosting."
  },
  {
    "id": "phi3.5-mini",
    "name": "Phi 3.5 Mini Instruct",
    "hf_id": "microsoft/Phi-3.5-mini-instruct",
    "vram_gb": 7.0,
    "context": "128000",
    "category": "SLM",
    "badge": "128K Ctx",
    "description": "Microsoft's 3.8B parameter model featuring a 128K token context window running in parallel."
  }
];

export function Home({ sseData, onSelectModel }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const liveModels = DEFAULT_CATALOG.map(m => {
    let status = 'IDLE';
    const isLoaded = sseData?.loaded_models?.some(lm => lm.model_id === m.id);
    if (isLoaded) {
      status = 'ACTIVE';
    } else if (sseData?.colab_status === 'STARTING') {
      status = 'LOADING';
    } else if (sseData?.vram?.free < m.vram_gb && sseData?.colab_status === 'ACTIVE') {
      status = 'QUEUED';
    }
    return { ...m, status };
  });

  const categories = ['ALL', 'SLM'];

  const filtered = liveModels.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                          m.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'ALL' || m.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '30px',
          background: 'rgba(124, 58, 237, 0.12)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          color: '#c084fc',
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          <Sparkles size={14} /> Dual-Model Parallel GPU Inference Engine
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: '1.15', marginBottom: '16px' }}>
          Absora AI Hub <br />
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Instant OpenAI-Compatible Endpoints
          </span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 36px', lineHeight: '1.6' }}>
          Deploy & access 2 models simultaneously in parallel (Qwen 2.5 7B & Phi 3.5 Mini) with shared VRAM packing, high-throughput continuous batching, and unified API keys.
        </p>

        {/* Search & Category Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div style={{ position: 'relative', width: '340px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search models by name or task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(17, 24, 39, 0.7)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '10px 14px 10px 42px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'rgba(17, 24, 39, 0.7)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'transparent',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time VRAM Cluster Status */}
      <VramDashboard
        vram={sseData?.vram}
        colabStatus={sseData?.colab_status}
        loadedModels={sseData?.loaded_models}
      />

      {/* Model Catalog Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={20} style={{ color: '#06b6d4' }} /> Available Models Catalog ({filtered.length})
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {filtered.map(m => (
          <ModelCard key={m.id} model={m} onSelect={onSelectModel} />
        ))}
      </div>

    </div>
  );
}
