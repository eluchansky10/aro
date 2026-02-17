'use client';

import { useState } from 'react';
import type { Plan } from '../lib/types';
import { MODEL_COLORS } from '../lib/constants';
import TaskRow from './TaskRow';

interface PlanDisplayProps {
  plan: Plan;
  taskModelCounts?: Record<string, number>;
  onModelCountChange?: (taskId: string, count: number) => void;
}

export default function PlanDisplay({ plan, taskModelCounts, onModelCountChange }: PlanDisplayProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const modelCounts = plan.tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.target_model] = (acc[t.target_model] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Strategy */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#a3a3a3', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Strategy
        </h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#d4d4d4' }}>{plan.strategy}</p>
      </div>

      {/* Distribution badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(modelCounts).map(([model, count]) => (
          <span
            key={model}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              background: `${MODEL_COLORS[model] || '#737373'}20`,
              color: MODEL_COLORS[model] || '#737373',
              border: `1px solid ${MODEL_COLORS[model] || '#737373'}40`,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: MODEL_COLORS[model] || '#737373',
            }} />
            {model} ({count})
          </span>
        ))}
        <span style={{ padding: '4px 10px', fontSize: 12, color: '#737373' }}>
          {plan.tasks.length} tasks total
        </span>
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {plan.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            expanded={expandedTask === task.id}
            onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            modelCount={taskModelCounts?.[task.id]}
            onModelCountChange={onModelCountChange}
          />
        ))}
      </div>

      {/* Synthesis strategy */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#a3a3a3', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Synthesis Strategy
        </h2>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#d4d4d4' }}>{plan.synthesis_strategy}</p>
      </div>
    </div>
  );
}
