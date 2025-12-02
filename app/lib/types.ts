// Block Types
export type BlockType = 'datasource' | 'filter' | 'aggregate' | 'sort' | 'chart' | 'insight';

// Column Information
export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

// Block Configuration Types
export interface DataSourceConfig {
  fileName: string;
  tableName: string;
  columns: ColumnInfo[];
}

export interface FilterConfig {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not contains';
  value: string | number;
}

export interface AggregateConfig {
  groupBy: string[];
  metrics: {
    column: string;
    func: 'sum' | 'avg' | 'count' | 'min' | 'max';
    alias: string;
  }[];
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  xAxis: string;
  yAxis: string;
  title?: string;
}

export interface InsightConfig {
  context: string;
  generatedInsight?: string;
}

// Union type for all block configs
export type BlockConfig =
  | DataSourceConfig
  | FilterConfig
  | AggregateConfig
  | SortConfig
  | ChartConfig
  | InsightConfig;

// Main Block Data Interface
export interface BlockData {
  id: string;
  type: BlockType;
  label: string;
  config: BlockConfig;
  status: 'idle' | 'running' | 'success' | 'error';
  outputTable?: string;
  error?: string;
}

// Block color mapping
export const BLOCK_COLORS: Record<BlockType, string> = {
  datasource: 'emerald',
  filter: 'blue',
  aggregate: 'purple',
  sort: 'orange',
  chart: 'pink',
  insight: 'yellow',
};
