import React, { useState } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

export function PlaygroundChat({ session, modelId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I am ${modelId} running live via Absora's unified API proxy. Send me any prompt!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const proxyEndpoint = session?.proxy_endpoint || '/api/v1/chat/completions';
  const apiKey = session?.api_key;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const res = await fetch(proxyEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: 512
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const botResponse = data.choices?.[0]?.message?.content || 'No response content received.';
      setMessages([...newMessages, { role: 'assistant', content: botResponse }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `[Error calling model]: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '520px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
        <Sparkles size={18} style={{ color: '#06b6d4' }} />
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Interactive Model Playground (NVIDIA NIM / OpenRouter Style)
        </h4>
        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
          Proxied & Hidden Backend
        </span>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '12px',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>
                <Bot size={18} color="white" />
              </div>
            )}

            <div style={{
              background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(6, 182, 212, 0.4))' : 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              color: 'var(--text-primary)'
            }}>
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>
                <User size={18} color="white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Loader2 size={16} className="animate-spin" /> Generating response via platform proxy...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
        <input
          type="text"
          placeholder="Type a prompt to test your model..."
          disabled={loading}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(10, 15, 26, 0.9)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
