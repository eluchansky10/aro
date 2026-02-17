export interface Task {
  id: string;
  title: string;
  prompt: string;
  target_model: string;
  dependencies: string[];
  priority: number;
  status: string;
}

export interface Plan {
  topic: string;
  strategy: string;
  tasks: Task[];
  synthesis_strategy: string;
  created_at: string;
}

export interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

export type ExportFormat = 'markdown' | 'pdf' | 'both';

export interface StoredPlan {
  id: string;
  topic: string;
  objective?: string;
  plan: Plan;
  created_at: string;
}
