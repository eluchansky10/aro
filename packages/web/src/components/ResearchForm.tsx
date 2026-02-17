'use client';

import type { UploadedFile, ExportFormat } from '../lib/types';
import ModelSelector from './ModelSelector';
import FileUploadZone from './FileUploadZone';
import ExportFormatSelector from './ExportFormatSelector';

interface ResearchFormProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  objective: string;
  onObjectiveChange: (objective: string) => void;
  selectedModels: Set<string>;
  onSelectedModelsChange: (models: Set<string>) => void;
  contextFiles: UploadedFile[];
  onContextFilesChange: (files: UploadedFile[]) => void;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ResearchForm({
  topic, onTopicChange,
  objective, onObjectiveChange,
  selectedModels, onSelectedModelsChange,
  contextFiles, onContextFilesChange,
  exportFormat, onExportFormatChange,
  loading, onSubmit,
}: ResearchFormProps) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 40 }}>
      {/* Research Objective */}
      <label style={{ display: 'block', fontSize: 13, color: '#a3a3a3', marginBottom: 8, fontWeight: 500 }}>
        Research Objective <span style={{ color: '#525252', fontWeight: 400 }}>(optional)</span>
      </label>
      <input
        type="text"
        value={objective}
        onChange={(e) => onObjectiveChange(e.target.value)}
        placeholder="e.g. Write a comparison report for enterprise decision-makers"
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 14,
          background: '#171717',
          border: '1px solid #333',
          borderRadius: 8,
          color: '#e5e5e5',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {/* Research Topic — paragraph textarea */}
      <label style={{ display: 'block', fontSize: 13, color: '#a3a3a3', marginBottom: 8, fontWeight: 500 }}>
        Research Topic
      </label>
      <textarea
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
        placeholder="Describe your research topic in detail. You can use multiple lines to provide context, scope, and specific areas of focus..."
        disabled={loading}
        rows={4}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 15,
          background: '#171717',
          border: '1px solid #333',
          borderRadius: 8,
          color: '#e5e5e5',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          lineHeight: 1.5,
          boxSizing: 'border-box',
          marginBottom: 16,
        }}
      />

      {/* Model Selection */}
      <ModelSelector
        selectedModels={selectedModels}
        onChange={onSelectedModelsChange}
        disabled={loading}
      />

      {/* File Upload */}
      <FileUploadZone
        files={contextFiles}
        onFilesChange={onContextFilesChange}
        disabled={loading}
      />

      {/* Export Format */}
      <ExportFormatSelector
        value={exportFormat}
        onChange={onExportFormatChange}
        disabled={loading}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !topic.trim()}
        style={{
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          background: loading ? '#262626' : '#fff',
          color: loading ? '#737373' : '#0a0a0a',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? 'Generating...' : 'Decompose'}
      </button>
    </form>
  );
}
