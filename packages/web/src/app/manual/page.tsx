'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import ChatPanel from '../../components/ChatPanel';
import { MANUAL_CONTENT } from './manual-content';

export default function ManualPage() {
  const [showChat, setShowChat] = useState(false);

  // Simple markdown-to-JSX renderer for the manual
  function renderMarkdown(md: string) {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Horizontal rule
      if (line.trim() === '---') {
        elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #262626', margin: '24px 0' }} />);
        i++;
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} style={{ fontSize: 24, fontWeight: 700, margin: '32px 0 16px', color: '#e5e5e5' }}>{line.slice(2)}</h1>);
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ fontSize: 18, fontWeight: 600, margin: '28px 0 12px', color: '#d4d4d4' }}>{line.slice(3)}</h2>);
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 600, margin: '20px 0 8px', color: '#a3a3a3' }}>{line.slice(4)}</h3>);
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} style={{
            margin: '8px 0', padding: '8px 16px',
            borderLeft: '3px solid #404040', color: '#a3a3a3',
            fontSize: 14, lineHeight: 1.6, fontStyle: 'italic',
          }}>
            {line.slice(2)}
          </blockquote>
        );
        i++;
        continue;
      }

      // List items
      if (line.startsWith('- ')) {
        const items: string[] = [];
        while (i < lines.length && lines[i].startsWith('- ')) {
          items.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} style={{ margin: '8px 0', paddingLeft: 24 }}>
            {items.map((item, j) => (
              <li key={j} style={{ fontSize: 14, lineHeight: 1.8, color: '#d4d4d4' }}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={i} style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.8, color: '#d4d4d4' }}>
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  }

  // Inline formatting: **bold**, `code`
  function renderInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Code
      const codeMatch = remaining.match(/`(.+?)`/);

      // Find earliest match
      let earliest: { type: 'bold' | 'code'; match: RegExpMatchArray } | null = null;
      if (boldMatch) {
        earliest = { type: 'bold', match: boldMatch };
      }
      if (codeMatch) {
        if (!earliest || (codeMatch.index ?? Infinity) < (earliest.match.index ?? Infinity)) {
          earliest = { type: 'code', match: codeMatch };
        }
      }

      if (!earliest) {
        parts.push(remaining);
        break;
      }

      const idx = earliest.match.index ?? 0;
      if (idx > 0) {
        parts.push(remaining.slice(0, idx));
      }

      if (earliest.type === 'bold') {
        parts.push(<strong key={key++} style={{ fontWeight: 600, color: '#e5e5e5' }}>{earliest.match[1]}</strong>);
      } else {
        parts.push(
          <code key={key++} style={{
            background: '#1e1e1e', padding: '2px 6px', borderRadius: 4,
            fontSize: '0.9em', color: '#c4b5fd',
          }}>
            {earliest.match[1]}
          </code>
        );
      }

      remaining = remaining.slice(idx + earliest.match[0].length);
    }

    return parts.length === 1 ? parts[0] : parts;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5' }}>
      <Header currentPage="manual" />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* AI Chat — at the top */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#a3a3a3' }}>
                Ask a Question
              </h2>
              <p style={{ fontSize: 13, color: '#525252', margin: '4px 0 0' }}>
                Chat with our AI assistant powered by Claude Sonnet 4.5.
              </p>
            </div>
            <button
              onClick={() => setShowChat(!showChat)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                background: showChat ? '#262626' : '#5b21b6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {showChat ? 'Hide Chat' : 'Open AI Chat'}
            </button>
          </div>

          {showChat && (
            <ChatPanel
              apiEndpoint="/api/manual-chat"
              placeholder="e.g. How do I upload context files?"
            />
          )}
        </div>

        {/* Manual content */}
        <div style={{ borderTop: '1px solid #262626', paddingTop: 24 }}>
          {renderMarkdown(MANUAL_CONTENT)}
        </div>
      </main>
    </div>
  );
}
