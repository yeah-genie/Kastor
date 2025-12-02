import { Logo } from '../ui/Logo';
import { Undo2, Redo2, LayoutTemplate, Play, Loader2, BrainCircuit, Menu, History, Settings, LayoutDashboard } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useBlockStore } from '../../store/useBlockStore';
import { useRunHistoryStore } from '../../store/useRunHistoryStore'; 
import { useEffect, useState, useRef } from 'react';
import { TemplateGallery } from '../modals/TemplateGallery';
import { GlobalRulesModal } from '../modals/GlobalRulesModal';
import { RunHistoryPanel } from '../panels/RunHistoryPanel'; // Import History Panel to show in Popover if needed, but simpler to toggle tab? 
// User preferred "History icon near Run button". 
// Let's implement a Popover for History or just toggle the right panel tab.
// Toggling the right panel tab is cleaner given existing architecture.

export const TopBar = () => {
  const { setActiveRightTab, toggleRightPanel, isRightPanelOpen, activeRightTab, isDashboardMode, toggleDashboardMode } = useUIStore();
  const { blocks, updateBlockStatus } = useBlockStore();
  const { addRun, updateRunStatus, addLog } = useRunHistoryStore(); 
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGlobalRules, setShowGlobalRules] = useState(false); 
  const [isRunning, setIsRunning] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // For settings dropdown
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleRun = async () => {
    if (isRunning || blocks.length === 0) return;
    setIsRunning(true);

    const runId = addRun({ 
        workflowName: 'My Workflow', 
        status: 'running'
    });

    addLog(runId, `Workflow started with ${blocks.length} blocks.`);

    try {
        for (const block of blocks) {
            updateBlockStatus(block.id, 'loading');
            addLog(runId, `Executing block: ${block.title} (${block.type})...`);
            await new Promise(resolve => setTimeout(resolve, 800)); 
            updateBlockStatus(block.id, 'success');
            addLog(runId, `✓ Block ${block.title} completed successfully.`);
        }
        updateRunStatus(runId, 'success', Date.now());
        addLog(runId, `Workflow completed successfully.`);
    } catch (error) {
        updateRunStatus(runId, 'failed', Date.now());
        addLog(runId, `Workflow failed: ${error}`);
    } finally {
        setIsRunning(false);
    }
  };

  const handleHistoryToggle = () => {
      if (isRightPanelOpen && activeRightTab === 'history') {
          toggleRightPanel(); // Close if already open
      } else {
          setActiveRightTab('history'); // Open history tab
      }
  };
  
  // Zundo state logic...
  const [temporalState, setTemporalState] = useState<{
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  }>({ undo: () => {}, redo: () => {}, canUndo: false, canRedo: false });

  useEffect(() => {
    // @ts-ignore
    if (useBlockStore.temporal) {
      // @ts-ignore
      const unsubscribe = useBlockStore.temporal.subscribe((state: any) => {
        setTemporalState({
          undo: state.undo,
          redo: state.redo,
          canUndo: state.pastStates.length > 0,
          canRedo: state.futureStates.length > 0
        });
      });
      // @ts-ignore
      const initialState = useBlockStore.temporal.getState();
      setTemporalState({
        undo: initialState.undo,
        redo: initialState.redo,
        canUndo: initialState.pastStates.length > 0,
        canRedo: initialState.futureStates.length > 0
      });
      return () => unsubscribe();
    }
  }, []);

  const { undo, redo, canUndo, canRedo } = temporalState;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) { if (canRedo) redo(); } else { if (canUndo) undo(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { if (canRedo) redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return (
    <div className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Left: Logo & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Logo size={24} />
          <div className="flex flex-col">
             <h1 className="text-sm font-bold text-slate-200 tracking-tight leading-none">Kastor</h1>
             <span className="text-[10px] text-slate-500 font-medium">Untitled Project</span>
          </div>
        </div>
        
        <div className="h-6 w-px bg-slate-800 mx-2" />
        
        {/* Minimal Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <button 
            onClick={() => undo()} 
            disabled={!canUndo}
            className="p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:hover:text-slate-500 rounded hover:bg-slate-800 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button 
            onClick={() => redo()} 
            disabled={!canRedo}
            className="p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:hover:text-slate-500 rounded hover:bg-slate-800 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>

      {/* Right: Primary Actions & Menu */}
      <div className="flex items-center gap-3">
        
        {/* History Toggle */}
        <button 
            onClick={handleHistoryToggle}
            className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all border border-transparent ${activeRightTab === 'history' && isRightPanelOpen ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
            title="View History"
        >
            <History size={18} />
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        {/* Dashboard Toggle */}
        <button 
          onClick={toggleDashboardMode}
          className={`
            h-9 px-4 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border
            ${isDashboardMode ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'}
          `}
          title="Toggle Dashboard View"
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </button>

        {/* Primary Run Button */}
        <button 
          onClick={handleRun}
          disabled={isRunning || blocks.length === 0}
          className="h-9 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none border border-blue-500"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          <span>Run</span>
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        {/* Settings Menu Dropdown */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors border border-transparent ${showMenu ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Menu size={18} />
            </button>

            {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                    <button 
                        onClick={() => { setShowGlobalRules(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                        <BrainCircuit size={16} className="text-purple-400" />
                        <span>Memory & Rules</span>
                    </button>
                    <button 
                        onClick={() => { setShowTemplates(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                        <LayoutTemplate size={16} className="text-blue-400" />
                        <span>Templates</span>
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-lg transition-colors text-left">
                        <Settings size={16} />
                        <span>App Settings</span>
                    </button>
                </div>
            )}
        </div>

        {/* User Profile */}
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700 ml-2 cursor-pointer hover:border-slate-500 transition-colors">
            YJ
        </div>
      </div>
      
      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} />
      <GlobalRulesModal isOpen={showGlobalRules} onClose={() => setShowGlobalRules(false)} />
    </div>
  );
};
