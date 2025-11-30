import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RunHistoryItem {
  id: string;
  workflowName: string;
  startTime: number;
  endTime?: number;
  status: 'success' | 'failed' | 'running';
  logs: string[];
}

interface RunHistoryState {
  history: RunHistoryItem[];
  addRun: (item: Omit<RunHistoryItem, 'id' | 'startTime' | 'logs'>) => string; // Returns ID
  updateRunStatus: (id: string, status: 'success' | 'failed', endTime: number) => void;
  addLog: (id: string, message: string) => void;
  clearHistory: () => void;
}

export const useRunHistoryStore = create<RunHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addRun: (item) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          history: [
            { ...item, id, startTime: Date.now(), logs: [] },
            ...state.history,
          ],
        }));
        return id;
      },
      updateRunStatus: (id, status, endTime) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, status, endTime } : item
          ),
        })),
      addLog: (id, message) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, logs: [...item.logs, message] } : item
          ),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'run-history-storage',
    }
  )
);

