import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import { Block, BlockType, QueryResult, ColumnInfo, CSVFileInfo } from '../lib/types';

interface FlowState {
  // React Flow state
  nodes: Node<Block>[];
  edges: Edge[];
  
  // Block results cache
  blockResults: Record<string, QueryResult>;
  
  // Selected block
  selectedBlockId: string | null;
  
  // Loaded CSV tables
  loadedTables: CSVFileInfo[];
  
  // Columns cache per table
  tableColumns: Record<string, ColumnInfo[]>;
  
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  addBlock: (type: BlockType, position: { x: number; y: number }) => string;
  updateBlockConfig: (blockId: string, config: Partial<Block['config']>) => void;
  updateBlockStatus: (blockId: string, status: Block['status'], error?: string) => void;
  setBlockOutputTable: (blockId: string, tableName: string) => void;
  deleteBlock: (blockId: string) => void;
  
  setSelectedBlock: (blockId: string | null) => void;
  
  setBlockResult: (blockId: string, result: QueryResult) => void;
  getBlockResult: (blockId: string) => QueryResult | undefined;
  
  addLoadedTable: (tableInfo: CSVFileInfo) => void;
  setTableColumns: (tableName: string, columns: ColumnInfo[]) => void;
  
  getDownstreamBlocks: (blockId: string) => string[];
  getUpstreamBlock: (blockId: string) => Block | undefined;
}

let blockIdCounter = 0;

const createDefaultConfig = (type: BlockType): Block['config'] => {
  switch (type) {
    case 'datasource':
      return { fileName: '', tableName: '' };
    case 'filter':
      return { column: '', operator: '=', value: '' };
    case 'aggregate':
      return { groupBy: [], metrics: [] };
    case 'sort':
      return { column: '', direction: 'asc' };
    case 'chart':
      return { type: 'bar', xAxis: '', yAxis: '' };
    case 'insight':
      return { prompt: '' };
      default:
        return { prompt: '' };
    }
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  blockResults: {},
  selectedBlockId: null,
  loadedTables: [],
  tableColumns: {},

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    // Update the target block's inputId
    const { nodes } = get();
    const targetNode = nodes.find((n) => n.id === connection.target);
    const sourceNode = nodes.find((n) => n.id === connection.source);
    
    if (targetNode && sourceNode) {
      set({
        edges: addEdge(connection, get().edges),
        nodes: nodes.map((node) =>
          node.id === connection.target
            ? {
                ...node,
                data: {
                  ...node.data,
                  inputId: connection.source,
                },
              }
            : node
        ),
      });
    }
  },

  addBlock: (type, position) => {
    const id = `block_${++blockIdCounter}`;
    const newBlock: Block = {
      id,
      type,
      config: createDefaultConfig(type),
      inputId: null,
      outputTableName: null,
      position,
      status: 'idle',
    };

    const newNode: Node<Block> = {
      id,
      type: 'blockNode',
      position,
      data: newBlock,
    };

    set({
      nodes: [...get().nodes, newNode],
    });

    return id;
  },

  updateBlockConfig: (blockId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === blockId
          ? {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, ...config },
              },
            }
          : node
      ),
    });
  },

  updateBlockStatus: (blockId, status, error) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === blockId
          ? {
              ...node,
              data: {
                ...node.data,
                status,
                error,
              },
            }
          : node
      ),
    });
  },

  setBlockOutputTable: (blockId, tableName) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === blockId
          ? {
              ...node,
              data: {
                ...node.data,
                outputTableName: tableName,
              },
            }
          : node
      ),
    });
  },

  deleteBlock: (blockId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== blockId),
      edges: get().edges.filter(
        (edge) => edge.source !== blockId && edge.target !== blockId
      ),
      selectedBlockId:
        get().selectedBlockId === blockId ? null : get().selectedBlockId,
    });
  },

  setSelectedBlock: (blockId) => {
    set({ selectedBlockId: blockId });
  },

  setBlockResult: (blockId, result) => {
    set({
      blockResults: {
        ...get().blockResults,
        [blockId]: result,
      },
    });
  },

  getBlockResult: (blockId) => {
    return get().blockResults[blockId];
  },

  addLoadedTable: (tableInfo) => {
    set({
      loadedTables: [...get().loadedTables.filter(t => t.tableName !== tableInfo.tableName), tableInfo],
    });
  },

  setTableColumns: (tableName, columns) => {
    set({
      tableColumns: {
        ...get().tableColumns,
        [tableName]: columns,
      },
    });
  },

  getDownstreamBlocks: (blockId) => {
    const { edges } = get();
    const downstream: string[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      edges
        .filter((edge) => edge.source === id)
        .forEach((edge) => {
          downstream.push(edge.target);
          traverse(edge.target);
        });
    };

    traverse(blockId);
    return downstream;
  },

  getUpstreamBlock: (blockId) => {
    const { edges, nodes: allNodes } = get();
    const edge = edges.find((e) => e.target === blockId);
    if (!edge) return undefined;
    
    const node = allNodes.find((n) => n.id === edge.source);
    return node?.data;
  },
}));
