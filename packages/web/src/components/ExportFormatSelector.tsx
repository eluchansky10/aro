'use client';

import type { ExportFormat } from '../lib/types';

interface ExportFormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  disabled?: boolean;
}

const OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown (for AI context purposes)' },
  { value: 'pdf', label: 'PDF - synthesized for user consumption' },
  { value: 'both', label: 'Both' },
];

export default function ExportFormatSelector({ value, onChange, disabled }: ExportFormatSelectorProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#a3a3a3', marginBottom: 8, fontWeight: 500 }}>
        Export Format
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 500,
              background: value === opt.value ? '#262626' : 'transparent',
              color: value === opt.value ? '#e5e5e5' : '#525252',
              border: `1px solid ${value === opt.value ? '#404040' : '#262626'}`,
              borderRadius: 6,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
