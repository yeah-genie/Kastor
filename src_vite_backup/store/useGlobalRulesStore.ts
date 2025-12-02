import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalRulesState {
  rules: string[];
  addRule: (rule: string) => void;
  removeRule: (index: number) => void;
  updateRule: (index: number, rule: string) => void;
}

export const useGlobalRulesStore = create<GlobalRulesState>()(
  persist(
    (set) => ({
      rules: [
        "Always visualize financial data as bar charts.",
        "Prefer darker colors for charts.",
        "Automatically remove null values from datasets."
      ], // Default rules
      addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
      removeRule: (index) => set((state) => ({ rules: state.rules.filter((_, i) => i !== index) })),
      updateRule: (index, rule) => set((state) => ({ 
        rules: state.rules.map((r, i) => (i === index ? rule : r)) 
      })),
    }),
    {
      name: 'global-rules-storage',
    }
  )
);

