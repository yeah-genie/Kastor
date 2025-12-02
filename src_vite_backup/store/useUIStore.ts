import { create } from 'zustand';

interface UIState {
  isLibraryOpen: boolean;
  isRightPanelOpen: boolean;
  activeRightTab: 'inspector' | 'ai' | 'history';
  isChatOnly: boolean;
  showAnnotations: boolean; // New state for annotations
  isDashboardMode: boolean; // New: Dashboard View Mode
  
  annotations: { id: string; x: number; y: number; content: string }[];
  addAnnotation: (x: number, y: number, content?: string) => void;
  updateAnnotation: (id: string, content: string) => void;
  removeAnnotation: (id: string) => void;
  moveAnnotation: (id: string, x: number, y: number) => void;

  // Canvas Interaction State
  zoom: number;
  pan: { x: number; y: number };
  
  // New: Context for file uploaded in Landing Page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingFileContext: { name: string; content: string; } | null;

  // Data Preview Modal State
  previewModal: {
    isOpen: boolean;
    blockId: string | null;
    title: string;
    initialTab: 'table' | 'chart';
    demoType?: 'saas' | 'marketing' | 'commerce'; // New: Track demo type
  };

  toggleLibrary: () => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (isOpen: boolean) => void;
  setActiveRightTab: (tab: 'inspector' | 'ai' | 'history') => void;
  setChatOnly: (isChatOnly: boolean) => void;
  toggleAnnotations: () => void; // Toggle annotations
  toggleDashboardMode: () => void; // Toggle dashboard mode
  setTourStep: (step: number) => void; // Set tour step
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPendingFileContext: (fileContext: { name: string; content: string; } | null) => void;

  openPreviewModal: (blockId: string, title: string, initialTab?: 'table' | 'chart', demoType?: 'saas' | 'marketing' | 'commerce') => void;
  closePreviewModal: () => void;
  
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLibraryOpen: false,
  isRightPanelOpen: true,
  activeRightTab: 'ai', // Default to AI now
  isChatOnly: true,
  showAnnotations: false, // Default hidden
  isDashboardMode: false,

  annotations: [
    { id: '1', x: 100, y: 100, content: 'Check this outlier!' },
    { id: '2', x: 400, y: 300, content: 'AI suggested transform' }
  ], // Initial mock annotations
  
  zoom: 1,
  pan: { x: 0, y: 0 },
  
  pendingFileContext: null,

  previewModal: {
    isOpen: false,
    blockId: null,
    title: '',
    initialTab: 'table',
  },

  toggleLibrary: () => set((state) => ({ isLibraryOpen: !state.isLibraryOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (isOpen) => set({ isRightPanelOpen: isOpen }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab, isRightPanelOpen: true }),
  setChatOnly: (isChatOnly) => set({ isChatOnly, isLibraryOpen: !isChatOnly, isRightPanelOpen: true, activeRightTab: 'ai' }),
  toggleAnnotations: () => set((state) => ({ showAnnotations: !state.showAnnotations })),
  toggleDashboardMode: () => set((state) => ({ isDashboardMode: !state.isDashboardMode })),
  
  addAnnotation: (x, y, content = 'New Note') => set((state) => {
    const now = Date.now();
    // Debounce: Prevent creating multiple notes within 300ms
    const lastNote = state.annotations[state.annotations.length - 1];
    if (lastNote && (parseInt(lastNote.id) > now - 300)) {
        return state;
    }
    return {
        annotations: [...state.annotations, { id: now.toString(), x, y, content }],
        showAnnotations: true
    };
  }),
  updateAnnotation: (id, content) => set((state) => ({
    annotations: state.annotations.map(a => a.id === id ? { ...a, content } : a)
  })),
  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter(a => a.id !== id)
  })),
  moveAnnotation: (id, x, y) => set((state) => ({
    annotations: state.annotations.map(a => a.id === id ? { ...a, x, y } : a)
  })),

  setPendingFileContext: (fileContext) => set({ pendingFileContext: fileContext }),
  
  openPreviewModal: (blockId, title, initialTab = 'table', demoType) => set({ previewModal: { isOpen: true, blockId, title, initialTab, demoType } }),
  closePreviewModal: () => set({ previewModal: { isOpen: false, blockId: null, title: '', initialTab: 'table', demoType: undefined } }),

  setZoom: (zoom) => set((state) => ({ 
    zoom: typeof zoom === 'function' ? Math.min(Math.max(zoom(state.zoom), 0.5), 2) : Math.min(Math.max(zoom, 0.5), 2) 
  })),
  setPan: (pan) => set((state) => ({ 
    pan: typeof pan === 'function' ? pan(state.pan) : pan 
  })),
}));
