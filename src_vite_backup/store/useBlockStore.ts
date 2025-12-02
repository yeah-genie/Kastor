import { create } from 'zustand';
import { temporal } from 'zundo';
import { Block, BlockType, BlockConfig } from '../types';
import { arrayMove } from '@dnd-kit/sortable';

interface BlockState {
  blocks: Block[];
  selectedBlockIds: string[];

  addBlock: (type: BlockType) => void;
  insertBlockAt: (index: number, type: BlockType) => void; // New: Insert at specific index
  duplicateBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  removeBlocks: (ids: string[]) => void;
  updateBlockConfig: (id: string, config: Partial<BlockConfig>) => void;
  updateBlockStatus: (id: string, status: Block['status']) => void;
  renameBlock: (id: string, newTitle: string) => void;
  toggleBlockCollapse: (id: string) => void; // New action
  selectBlock: (id: string | null, multi?: boolean) => void;
  moveBlock: (activeId: string, overId: string) => void;
  setBlocks: (blocks: Block[]) => void;
  autoLayoutBlocks: () => void;
}

// Helper for ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useBlockStore = create<BlockState>()(
  temporal(
    (set) => ({
      blocks: [],
      selectedBlockIds: [],

      addBlock: (type) => set((state) => {
        const newBlock: Block = {
          id: generateId(),
          type,
          title: `New ${type} Block`,
          config: type === BlockType.SCHEDULE ? { enabled: false, frequency: 'daily', time: '09:00' } : {}, // Init schedule config
          status: 'idle',
        };
        return { blocks: [...state.blocks, newBlock], selectedBlockIds: [newBlock.id] };
      }),

      insertBlockAt: (index, type) => set((state) => {
        const newBlock: Block = {
          id: generateId(),
          type,
          title: `New ${type} Block`,
          config: type === BlockType.SCHEDULE ? { enabled: false, frequency: 'daily', time: '09:00' } : {}, 
          status: 'idle',
        };
        const newBlocks = [...state.blocks];
        newBlocks.splice(index, 0, newBlock);
        return { blocks: newBlocks, selectedBlockIds: [newBlock.id] };
      }),

      duplicateBlock: (id) => set((state) => {
        const originalBlock = state.blocks.find(b => b.id === id);
        if (!originalBlock) return state;

        const newBlock: Block = {
          ...originalBlock,
          id: generateId(),
          title: `${originalBlock.title} (Copy)`,
        };
        
        const index = state.blocks.findIndex(b => b.id === id);
        const newBlocks = [...state.blocks];
        newBlocks.splice(index + 1, 0, newBlock);

        return { blocks: newBlocks, selectedBlockIds: [newBlock.id] };
      }),

      removeBlock: (id) => set((state) => ({
        blocks: state.blocks.filter(b => b.id !== id),
        selectedBlockIds: state.selectedBlockIds.filter(selectedId => selectedId !== id)
      })),

      removeBlocks: (ids) => set((state) => ({
        blocks: state.blocks.filter(b => !ids.includes(b.id)),
        selectedBlockIds: state.selectedBlockIds.filter(selectedId => !ids.includes(selectedId))
      })),

      updateBlockConfig: (id, config) => set((state) => {
        const index = state.blocks.findIndex(b => b.id === id);
        return {
          blocks: state.blocks.map((b, i) => {
            if (b.id === id) return { ...b, config: { ...b.config, ...config } };
            // Mark downstream blocks as stale
            if (index !== -1 && i > index) return { ...b, isStale: true };
            return b;
          })
        };
      }),

      updateBlockStatus: (id, status) => set((state) => ({
        blocks: state.blocks.map(b => 
          b.id === id ? { ...b, status, isStale: false } : b // Reset stale on run
        )
      })),

      renameBlock: (id, newTitle) => set((state) => ({
        blocks: state.blocks.map(b => 
          b.id === id ? { ...b, title: newTitle } : b
        )
      })),

      toggleBlockCollapse: (id) => set((state) => ({
        blocks: state.blocks.map(b => 
          b.id === id ? { ...b, collapsed: !b.collapsed } : b
        )
      })),

      selectBlock: (id, multi = false) => set((state) => {
        if (id === null) return { selectedBlockIds: [] };
        
        if (multi) {
          if (state.selectedBlockIds.includes(id)) {
            return { selectedBlockIds: state.selectedBlockIds.filter(i => i !== id) };
          }
          return { selectedBlockIds: [...state.selectedBlockIds, id] };
        }
        
        return { selectedBlockIds: [id] };
      }),

      moveBlock: (activeId, overId) => set((state) => {
        const oldIndex = state.blocks.findIndex(b => b.id === activeId);
        const newIndex = state.blocks.findIndex(b => b.id === overId);
        return { blocks: arrayMove(state.blocks, oldIndex, newIndex) };
      }),

      setBlocks: (blocks) => set({ blocks }),

      autoLayoutBlocks: () => set((state) => {
        const typeOrder: Record<string, number> = {
           [BlockType.SCHEDULE]: -1,
           [BlockType.LOAD]: 0,
           [BlockType.API_CALL]: 0,
           [BlockType.CLEAN]: 1,
           [BlockType.JOIN]: 2,
           [BlockType.FILTER]: 3,
           [BlockType.GROUP_BY]: 4,
           [BlockType.SORT]: 5,
           [BlockType.TRANSFORM]: 6,
           [BlockType.INSIGHT]: 7,
           [BlockType.ASK_AI]: 7,
           [BlockType.VISUALIZE]: 8,
           [BlockType.KPI_CARD]: 8,
           [BlockType.ACTION]: 9,
           [BlockType.EXPORT]: 9,
           [BlockType.NOTIFY]: 9,
           [BlockType.GROUP]: 10, // Groups can be anywhere, but default to end or handle specially
         };
         
         const sortedBlocks = [...state.blocks].sort((a, b) => {
           const scoreA = typeOrder[a.type] ?? 99;
           const scoreB = typeOrder[b.type] ?? 99;
           return scoreA - scoreB;
         });
         
         return { blocks: sortedBlocks };
      }),
    }),
    {
      limit: 100,
    }
  )
);
