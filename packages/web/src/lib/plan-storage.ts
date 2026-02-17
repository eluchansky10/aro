import type { Plan, StoredPlan } from './types';

const STORAGE_KEY = 'aro_saved_plans';
const MAX_STORED_PLANS = 100;

export function savePlan(plan: Plan, objective?: string): StoredPlan {
  const stored: StoredPlan = {
    id: crypto.randomUUID(),
    topic: plan.topic,
    objective,
    plan,
    created_at: plan.created_at,
  };

  const existing = getPlans();
  existing.unshift(stored);
  if (existing.length > MAX_STORED_PLANS) existing.length = MAX_STORED_PLANS;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage full or unavailable — degrade silently
  }

  return stored;
}

export function getPlans(): StoredPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getPlan(id: string): StoredPlan | null {
  return getPlans().find(p => p.id === id) || null;
}

export function deletePlan(id: string): void {
  try {
    const plans = getPlans().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // ignore
  }
}

export function clearAllPlans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
