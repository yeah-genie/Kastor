
export enum NodeType {
  SOURCE = 'SOURCE',
  TRANSFORM = 'TRANSFORM',
  VISUALIZE = 'VISUALIZE',
  AI_ANALYST = 'AI_ANALYST',
}

// Sub-types for Transforms to handle more logic
export enum TransformType {
    FILTER = 'FILTER',
    SORT = 'SORT',
    MATH = 'MATH',
    GROUP_BY = 'GROUP_BY',
    LIMIT = 'LIMIT',
    RENAME = 'RENAME',
    DROP = 'DROP',
    CLEAN = 'CLEAN'
}

export interface NodeData {
  label: string;
  subLabel?: string; 
  // Helper to store local configuration for the node
  config: Record<string, any>; 
  // The actual data flowing out of this node (calculated)
  outputData?: any[]; 
  // AI Analysis result
  aiAnalysis?: string;
  isLoading?: boolean;
  // Metadata for source nodes
  fileName?: string;
  fileContent?: string; // Raw CSV string
}

export interface Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface DatasetRow {
  [key: string]: string | number;
}