'use client';

import { useState } from 'react';
import type { Plan, ExportFormat } from '../lib/types';
import { planToMarkdown } from '../lib/export-markdown';

interface ExportActionsProps {
  plan: Plan;
  exportFormat: ExportFormat;
  objective?: string;
  taskModelCounts?: Record<string, number>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportActions({ plan, exportFormat, objective, taskModelCounts }: ExportActionsProps) {
  const [exporting, setExporting] = useState(false);

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `aro-plan-${Date.now()}.json`);
  }

  function handleExportMarkdown() {
    const md = planToMarkdown(plan, objective, taskModelCounts);
    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `aro-plan-${Date.now()}.md`);
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const { planToPdfBlob } = await import('../lib/export-pdf');
      const blob = await planToPdfBlob(plan, objective, taskModelCounts);
      downloadBlob(blob, `aro-plan-${Date.now()}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  async function handleExport() {
    if (exportFormat === 'markdown') {
      handleExportMarkdown();
    } else if (exportFormat === 'pdf') {
      await handleExportPdf();
    } else {
      handleExportMarkdown();
      await handleExportPdf();
    }
  }

  const buttonStyle = {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    background: '#171717',
    color: '#a3a3a3',
    border: '1px solid #333',
    borderRadius: 8,
    cursor: 'pointer' as const,
  };

  const formatLabel = exportFormat === 'both' ? 'Markdown + PDF' : exportFormat === 'pdf' ? 'PDF (synthesized)' : 'Markdown';

  return (
    <div style={{ marginTop: 32, display: 'flex', gap: 8 }}>
      <button onClick={handleExport} disabled={exporting} style={buttonStyle}>
        {exporting ? 'Generating...' : `Export ${formatLabel}`}
      </button>
      <button onClick={handleExportJSON} style={{ ...buttonStyle, color: '#525252' }}>
        Export JSON
      </button>
    </div>
  );
}
