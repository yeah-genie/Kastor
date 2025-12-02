import { create } from 'zustand';
import { Node, Edge, addEdge, Connection } from '@xyflow/react';
import { BlockData, BlockType, BlockConfig } from './types';

interface CanvasState {
  nodes: Node<BlockData>[];
  edges: Edge[];
  selectedBlockId: string | null;

  // Actions
  addBlock: (type: BlockType, position: { x: number; y: number }) => void;
  updateBlockConfig: (id: string, config: Partial<BlockConfig>) => void;
  removeBlock: (id: string) => void;
  connectBlocks: (connection: Connection) => void;
  setSelectedBlock: (id: string | null) => void;
  updateBlockStatus: (id: string, status: BlockData['status']) => void;
  updateBlockOutput: (id: string, outputTable: string) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
}

// Helper to generate unique IDs
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create default config based on block type
const getDefaultConfig = (type: BlockType): BlockConfig => {
  switch (type) {
    case 'datasource':
      return { fileName: '', tableName: '', columns: [] };
    case 'filter':
      return { column: '', operator: '=', value: '' };
    case 'aggregate':
      return { groupBy: [], metrics: [] };
    case 'sort':
      return { column: '', direction: 'asc' };
    case 'chart':
      return { type: 'line', xAxis: '', yAxis: '' };
    case 'insight':
      return { context: '' };
    default:
      return {} as BlockConfig;
  }
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedBlockId: null,

  addBlock: (type, position) => {
    const id = generateId();
    const newNode: Node<BlockData> = {
      id,
      type: 'block',
      position,
      data: {
        id,
        type,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Block`,
        config: getDefaultConfig(type),
        status: 'idle',
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedBlockId: id,
    }));
  },

  updateBlockConfig: (id, config) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, ...config },
              },
            }
          : node
      ),
    }));
  },

  removeBlock: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    }));
  },

  connectBlocks: (connection) => {
    set((state) => ({
      edges: addEdge(connection, state.edges),
    }));
  },

  setSelectedBlock: (id) => {
    set({ selectedBlockId: id });
  },

  updateBlockStatus: (id, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, status },
            }
          : node
      ),
    }));
  },

  updateBlockOutput: (id, outputTable) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, outputTable },
            }
          : node
      ),
    }));
  },

  onNodesChange: (changes) => {
    const { nodes } = get();
    // Apply node changes (position, selection, etc.)
    const updatedNodes = changes.reduce((acc: Node<BlockData>[], change: any) => {
      if (change.type === 'position' && change.position) {
        return acc.map((node) =>
          node.id === change.id ? { ...node, position: change.position } : node
        );
      }
      if (change.type === 'remove') {
        return acc.filter((node) => node.id !== change.id);
      }
      return acc;
    }, nodes);

    set({ nodes: updatedNodes });
  },

  onEdgesChange: (changes) => {
    const { edges } = get();
    // Apply edge changes (remove, etc.)
    const updatedEdges = changes.reduce((acc: Edge[], change: any) => {
      if (change.type === 'remove') {
        return acc.filter((edge) => edge.id !== change.id);
      }
      return acc;
    }, edges);

    set({ edges: updatedEdges });
  },
}));
