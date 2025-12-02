// Block System Types

export type BlockType = 'datasource' | 'filter' | 'aggregate' | 'sort' | 'chart' | 'insight';

// Block Configurations
export interface DataSourceConfig {
  fileName: string;
  tableName: string;
}

export interface FilterConfig {
  column: string;
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=' | 'contains';
  value: string | number;
}

export interface AggregateMetric {
  column: string;
  func: 'sum' | 'avg' | 'count' | 'min' | 'max';
  alias?: string;
}

export interface AggregateConfig {
  groupBy: string[];
  metrics: AggregateMetric[];
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie';
  xAxis: string;
  yAxis: string;
  title?: string;
}

export interface InsightConfig {
  prompt: string;
}

export type BlockConfig = 
  | DataSourceConfig 
  | FilterConfig 
  | AggregateConfig 
  | SortConfig 
  | ChartConfig 
  | InsightConfig;

// Block Definition
export interface Block {
  id: string;
  type: BlockType;
  config: BlockConfig;
  inputId: string | null;
  outputTableName: string | null;
  position: { x: number; y: number };
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
}

// Typed Block helpers
export interface DataSourceBlock extends Block {
  type: 'datasource';
  config: DataSourceConfig;
}

export interface FilterBlock extends Block {
  type: 'filter';
  config: FilterConfig;
}

export interface AggregateBlock extends Block {
  type: 'aggregate';
  config: AggregateConfig;
}

export interface SortBlock extends Block {
  type: 'sort';
  config: SortConfig;
}

export interface ChartBlock extends Block {
  type: 'chart';
  config: ChartConfig;
}

export interface InsightBlock extends Block {
  type: 'insight';
  config: InsightConfig;
}

// Column Metadata
export interface ColumnInfo {
  name: string;
  type: string;
}

// Query Result
export interface QueryResult {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

// Block Execution Context
export interface ExecutionContext {
  blockId: string;
  inputTableName: string | null;
  outputTableName: string;
}

// CSV File Info
export interface CSVFileInfo {
  fileName: string;
  tableName: string;
  columns: ColumnInfo[];
  rowCount: number;
}
