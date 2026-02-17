'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  apiEndpoint: string;
  placeholder?: string;
}

export default function ChatPanel({ apiEndpoint, placeholder = 'Ask a question...' }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error || res.statusText}` }]);
        return;
      }

      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: '#141414',
      border: '1px solid #262626',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      height: 400,
    }}>
      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#404040', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
            Ask questions about how to use ARO
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.6,
              background: msg.role === 'user' ? '#262626' : '#1a1a2e',
              color: msg.role === 'user' ? '#e5e5e5' : '#c4b5fd',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              background: '#1a1a2e',
              color: '#6d5fad',
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} style={{
        borderTop: '1px solid #262626',
        padding: 12,
        display: 'flex',
        gap: 8,
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#e5e5e5',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: loading ? '#262626' : '#5b21b6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
