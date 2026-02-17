'use client';

import { useState, useEffect } from 'react';
import type { StoredPlan } from '../../lib/types';
import { getPlans, deletePlan, clearAllPlans } from '../../lib/plan-storage';
import Header from '../../components/Header';
import PlanDisplay from '../../components/PlanDisplay';

export default function HistoryPage() {
  const [plans, setPlans] = useState<StoredPlan[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlans(getPlans());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deletePlan(id);
    setPlans(getPlans());
    if (expandedPlanId === id) setExpandedPlanId(null);
  }

  function handleClearAll() {
    if (!confirm('Delete all saved plans? This cannot be undone.')) return;
    clearAllPlans();
    setPlans([]);
    setExpandedPlanId(null);
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5' }}>
      <Header currentPage="history" />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Research History</h2>
          {plans.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                background: 'transparent',
                color: '#525252',
                border: '1px solid #333',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {!loaded ? (
          <div style={{ color: '#525252', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
            Loading...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ color: '#525252', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
            No previous plans. Generate your first research plan to see it here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plans.map((stored) => {
              const expanded = expandedPlanId === stored.id;
              const taskCount = stored.plan.tasks.length;
              const models = [...new Set(stored.plan.tasks.map(t => t.target_model))];

              return (
                <div key={stored.id} style={{
                  background: '#141414',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  {/* Summary row */}
                  <div
                    onClick={() => setExpandedPlanId(expanded ? null : stored.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: '#d4d4d4', marginBottom: 4 }}>
                        {stored.topic.length > 80 ? stored.topic.slice(0, 80) + '...' : stored.topic}
                      </div>
                      <div style={{ fontSize: 12, color: '#525252' }}>
                        {formatDate(stored.created_at)} — {taskCount} tasks — {models.join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(stored.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#404040',
                        cursor: 'pointer',
                        fontSize: 13,
                        padding: '4px 8px',
                      }}
                      title="Delete this plan"
                    >
                      Delete
                    </button>
                    <span style={{ fontSize: 12, color: '#404040' }}>
                      {expanded ? '\u25B2' : '\u25BC'}
                    </span>
                  </div>

                  {/* Expanded plan */}
                  {expanded && (
                    <div style={{
                      padding: '0 16px 16px',
                      borderTop: '1px solid #1e1e1e',
                    }}>
                      <div style={{ paddingTop: 16 }}>
                        <PlanDisplay plan={stored.plan} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
