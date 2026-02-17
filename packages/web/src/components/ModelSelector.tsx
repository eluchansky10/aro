'use client';

import { AVAILABLE_MODELS, MODEL_COLORS } from '../lib/constants';

interface ModelSelectorProps {
  selectedModels: Set<string>;
  onChange: (models: Set<string>) => void;
  disabled?: boolean;
}

export default function ModelSelector({ selectedModels, onChange, disabled }: ModelSelectorProps) {
  function handleToggle(modelId: string) {
    const next = new Set(selectedModels);
    if (next.has(modelId)) {
      if (next.size <= 1) return; // prevent deselecting all
      next.delete(modelId);
    } else {
      next.add(modelId);
    }
    onChange(next);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#a3a3a3', marginBottom: 8, fontWeight: 500 }}>
        Target Models
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {AVAILABLE_MODELS.map((model) => {
          const checked = selectedModels.has(model.id);
          const color = MODEL_COLORS[model.id] || '#737373';
          const isLastChecked = checked && selectedModels.size === 1;

          return (
            <label
              key={model.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                background: checked ? `${color}15` : '#141414',
                border: `1px solid ${checked ? `${color}50` : '#333'}`,
                color: checked ? color : '#525252',
                cursor: disabled || isLastChecked ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(model.id)}
                disabled={disabled || isLastChecked}
                style={{ display: 'none' }}
              />
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: checked ? color : '#525252',
              }} />
              {model.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}
