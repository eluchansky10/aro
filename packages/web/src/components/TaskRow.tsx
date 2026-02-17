'use client';

import type { Task } from '../lib/types';
import { MODEL_COLORS } from '../lib/constants';

interface TaskRowProps {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  modelCount?: number;
  onModelCountChange?: (taskId: string, count: number) => void;
}

export default function TaskRow({ task, expanded, onToggleExpand, modelCount, onModelCountChange }: TaskRowProps) {
  return (
    <div style={{
      background: '#141414',
      border: '1px solid #262626',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggleExpand}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: 11, fontFamily: 'monospace', color: '#525252', minWidth: 50,
        }}>
          {task.id}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 4,
          background: `${MODEL_COLORS[task.target_model] || '#737373'}20`,
          color: MODEL_COLORS[task.target_model] || '#737373',
          minWidth: 70,
          textAlign: 'center',
        }}>
          {task.target_model}
        </span>
        <span style={{ fontSize: 14, color: '#d4d4d4', flex: 1 }}>
          {task.title}
        </span>
        {task.dependencies.length > 0 && (
          <span style={{ fontSize: 11, color: '#525252' }}>
            deps: {task.dependencies.join(', ')}
          </span>
        )}
        {onModelCountChange && (
          <select
            value={modelCount ?? 2}
            onChange={(e) => {
              e.stopPropagation();
              onModelCountChange(task.id, Number(e.target.value));
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e1e',
              color: '#a3a3a3',
              border: '1px solid #333',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              cursor: 'pointer',
            }}
            title="Number of models to run this task"
          >
            {[1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{n} model{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        )}
        <span style={{ fontSize: 12, color: '#404040' }}>{expanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expanded && (
        <div style={{
          padding: '0 14px 14px',
          borderTop: '1px solid #1e1e1e',
        }}>
          <pre style={{
            margin: '12px 0 0',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#a3a3a3',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
          }}>
            {task.prompt}
          </pre>
        </div>
      )}
    </div>
  );
}
