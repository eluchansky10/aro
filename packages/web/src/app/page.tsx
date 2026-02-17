'use client';

import { useState } from 'react';
import type { Plan, UploadedFile, ExportFormat } from '../lib/types';
import { AVAILABLE_MODELS, DEFAULT_MODEL_COUNT } from '../lib/constants';
import { savePlan } from '../lib/plan-storage';
import Header from '../components/Header';
import ResearchForm from '../components/ResearchForm';
import PlanDisplay from '../components/PlanDisplay';
import ExportActions from '../components/ExportActions';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(
    new Set(AVAILABLE_MODELS.map(m => m.id))
  );
  const [contextFiles, setContextFiles] = useState<UploadedFile[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskModelCounts, setTaskModelCounts] = useState<Record<string, number>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError('');
    setPlan(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          objective: objective.trim() || undefined,
          selectedModels: Array.from(selectedModels),
          context_files: contextFiles.length > 0
            ? contextFiles.map(f => ({ name: f.name, content: f.content }))
            : undefined,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError(`Server returned ${res.status} with non-JSON response. The function may have timed out.`);
        return;
      }

      if (!res.ok) {
        let msg = data.error || `Request failed (${res.status})`;
        if (data.raw_text) msg += `\n\nRaw response: ${data.raw_text.slice(0, 300)}`;
        if (data.finish_reason) msg += `\n\nFinish reason: ${data.finish_reason}`;
        setError(msg);
        return;
      }

      setPlan(data.plan);

      // Initialize model counts for all tasks
      const defaults: Record<string, number> = {};
      for (const task of data.plan.tasks) {
        defaults[task.id] = DEFAULT_MODEL_COUNT;
      }
      setTaskModelCounts(defaults);

      // Auto-save to localStorage
      try {
        savePlan(data.plan, objective.trim() || undefined);
      } catch {
        // localStorage may be unavailable
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleModelCountChange(taskId: string, count: number) {
    setTaskModelCounts(prev => ({ ...prev, [taskId]: count }));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5' }}>
      <Header currentPage="home" />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <ResearchForm
          topic={topic}
          onTopicChange={setTopic}
          objective={objective}
          onObjectiveChange={setObjective}
          selectedModels={selectedModels}
          onSelectedModelsChange={setSelectedModels}
          contextFiles={contextFiles}
          onContextFilesChange={setContextFiles}
          exportFormat={exportFormat}
          onExportFormatChange={setExportFormat}
          loading={loading}
          onSubmit={handleSubmit}
        />

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#1c1007',
            border: '1px solid #78350f',
            borderRadius: 8,
            color: '#fbbf24',
            fontSize: 14,
            marginBottom: 24,
            whiteSpace: 'pre-wrap',
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#737373' }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Calling Claude Opus 4.6...</div>
            <div style={{ fontSize: 12 }}>Decomposing your topic into research sub-tasks</div>
          </div>
        )}

        {/* Plan result */}
        {plan && (
          <>
            <PlanDisplay
              plan={plan}
              taskModelCounts={taskModelCounts}
              onModelCountChange={handleModelCountChange}
            />
            <ExportActions
              plan={plan}
              exportFormat={exportFormat}
              objective={objective.trim() || undefined}
              taskModelCounts={taskModelCounts}
            />
          </>
        )}
      </main>
    </div>
  );
}
