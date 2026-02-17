export const MODEL_COLORS: Record<string, string> = {
  claude: '#d97706',
  chatgpt: '#10b981',
  gemini: '#3b82f6',
  perplexity: '#8b5cf6',
  kimi: '#ef4444',
  manus: '#06b6d4',
};

export const AVAILABLE_MODELS = [
  { id: 'claude', name: 'Claude', capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'research'] },
  { id: 'chatgpt', name: 'ChatGPT', capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'browsing'] },
  { id: 'gemini', name: 'Gemini', capabilities: ['reasoning', 'analysis', 'coding', 'multimodal', 'search'] },
  { id: 'perplexity', name: 'Perplexity', capabilities: ['research', 'search', 'citations', 'fact-checking'] },
  { id: 'kimi', name: 'Kimi K2.5', capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'research'] },
  { id: 'manus', name: 'Manus 1.6 Max', capabilities: ['reasoning', 'analysis', 'agentic', 'browsing', 'coding'] },
] as const;

export const DEFAULT_MODEL_COUNT = 2;
export const MAX_CONTEXT_FILES = 5;
export const MAX_FILE_SIZE_BYTES = 50 * 1024; // 50KB
