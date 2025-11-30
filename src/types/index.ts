export enum BlockType {
  // Data Sources
  LOAD = 'LOAD',
  API_CALL = 'API_CALL',

  // Preprocessing
  TRANSFORM = 'TRANSFORM',
  FILTER = 'FILTER',
  SORT = 'SORT',
  JOIN = 'JOIN',
  GROUP_BY = 'GROUP_BY',
  CLEAN = 'CLEAN',

  // Analysis & AI
  INSIGHT = 'INSIGHT',
  ASK_AI = 'ASK_AI',

  // Visualization
  VISUALIZE = 'VISUALIZE',
  KPI_CARD = 'KPI_CARD',

  // Action
  ACTION = 'ACTION',
  EXPORT = 'EXPORT',
  NOTIFY = 'NOTIFY',

  // Logic / Control
  GROUP = 'GROUP',
  SCHEDULE = 'SCHEDULE',
}

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any; // Specific config based on type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input?: any; // Data flowing into this block
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any; // Data produced by this block
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  isStale?: boolean; // New: Needs update due to upstream changes
  children?: string[]; // IDs of child blocks (for grouping)
  isGroup?: boolean;
  collapsed?: boolean;
}

// --- Specific Config Interfaces ---

export interface LoadBlockConfig {
  sourceType: 'file' | 'api';
  url?: string;
  fileName?: string;
}

export interface TransformBlockConfig {
  code: string; // Transformation logic (AI generated or manual)
  description: string;
  mode?: 'ai' | 'sql'; // Add mode to interface
}

export interface FilterBlockConfig {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface SortBlockConfig {
  column: string;
  order: 'asc' | 'desc';
}

export interface VisualizeBlockConfig {
  chartType: 'bar' | 'line' | 'pie' | 'table';
  xAxis?: string;
  yAxis?: string;
  title?: string;
}

export interface InsightBlockConfig {
  localFacts: string[];
  benchmarks: {
    metric: string;
    value: string | number;
    source?: string;
  }[];
  hypotheses: {
    id: string;
    description: string;
    confidence: number;
  }[];
}

export interface ActionItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ActionBlockConfig {
  suggestion: string;
  checklist: ActionItem[];
  actionStatus: 'pending' | 'approved' | 'executed';
}

export interface ScheduleBlockConfig {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // e.g., "09:00"
    days?: string[]; // e.g., ["Mon", "Wed"]
    enabled: boolean;
}

// Union type for type safety
export type BlockConfig = 
  | LoadBlockConfig 
  | TransformBlockConfig 
  | FilterBlockConfig
  | SortBlockConfig
  | VisualizeBlockConfig 
  | InsightBlockConfig 
  | ActionBlockConfig
  | ScheduleBlockConfig;
